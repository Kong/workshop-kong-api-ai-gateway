local embeddings = require("kong.llm.embeddings")
local uuid = require("kong.tools.utils").uuid
local vectordb = require("kong.llm.vectordb")

local function get_plugin_by_id(id)
  local row, err = kong.db.plugins:select(
    {id = id},
    { workspace = ngx.null, show_ws_id = true, expand_partials = true }
  )

  if err then
      return nil, err
  end

  return row
end

local function ingest_chunk(conf, content)
  local err
  local metadata = {
      ingest_duration = ngx.now(),
  }
  -- vectordb driver init
  local vectordb_driver
  do
      vectordb_driver, err = vectordb.new(conf.vectordb.strategy, conf.vectordb_namespace, conf.  vectordb)
      if err then
          return nil, "Failed to load the '" .. conf.vectordb.strategy .. "' vector database   driver: " .. err
      end
  end

  -- embeddings init
  local embeddings_driver, err = embeddings.new(conf.embeddings, conf.vectordb.dimensions)
  if err then
      return nil, "Failed to instantiate embeddings driver: " .. err
  end

  local embeddings_vector, embeddings_tokens_count, err = embeddings_driver:generate(content)
  if err then
      return nil, "Failed to generate embeddings: " .. err
  end

  metadata.embeddings_tokens_count = embeddings_tokens_count
  if #embeddings_vector ~= conf.vectordb.dimensions then
    return nil, "Embedding dimensions do not match the configured vector database. Embeddings were   " ..
      #embeddings_vector .. " dimensions, but the vector database is configured for " ..
      conf.vectordb.dimensions .. " dimensions.", "Embedding dimensions do not match the   configured vector database"
  end

  metadata.chunk_id = uuid()
  -- ingest chunk
  local _, err = vectordb_driver:insert(embeddings_vector, content, metadata.chunk_id)
  if err then
      return nil, "Failed to insert chunk: " .. err
  end

  return true
end

assert(#args == 3, "2 arguments expected")
local plugin_id, content = args[2], args[3]

local plugin, err = get_plugin_by_id(plugin_id)
if err then
  ngx.log(ngx.ERR, "Failed to get plugin: " .. err)
  return
end

if not plugin then
  ngx.log(ngx.ERR, "Plugin not found")
  return
end

local _, err = ingest_chunk(plugin.config, content)
if err then
  ngx.log(ngx.ERR, "Failed to ingest: " .. err)
  return
end

ngx.log(ngx.INFO, "Update completed")