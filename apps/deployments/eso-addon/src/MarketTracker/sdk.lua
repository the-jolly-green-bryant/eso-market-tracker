local function bxor8(a, b)
  local result = 0
  local bit = 1

  for _ = 1, 8 do
    local aBit = a % 2
    local bBit = b % 2

    if aBit ~= bBit then
      result = result + bit
    end

    a = math.floor(a / 2)
    b = math.floor(b / 2)
    bit = bit * 2
  end

  return result
end

local function xorLowByte(hash, byte)
  local high = math.floor(hash / 256)
  local low = hash - (high * 256)
  return high * 256 + bxor8(low, byte)
end

local function mul32(a, b)
  local aLo = a % 65536
  local aHi = math.floor(a / 65536)
  local bLo = b % 65536
  local bHi = math.floor(b / 65536)

  local low = aLo * bLo
  local mid = (aLo * bHi + aHi * bLo) % 65536

  return (low + mid * 65536) % 4294967296
end

--[[
    Strips ESO localization suffixes (e.g., ^M, ^F) from item names.
    Uses zo_strformat for robust, game-consistent handling.
    Example: "Iron Sword^m" -> "Iron Sword"
]]
local function _normalizeName(name)
    name = name:gsub("%^%a+", "")
    name = name:gsub("-", "")
    name = name:gsub("[^%w ]", "")
    name = string.lower(name)
    name = string.gsub(name, "[^a-z0-9 ]", "")
    return name
end

function GetIdFromName(name)
  name = _normalizeName(name)

  local hash = 2166136261 -- 0x811c9dc5
  local prime = 16777619  -- 0x01000193

  for i = 1, string.len(name) do
    local c = string.byte(name, i)
    hash = xorLowByte(hash, c)
    hash = mul32(hash, prime)
  end

  return hash
end

local function _normalizeId(v)
  if v == nil then
    return "--"
  end

  local n = tonumber(v)
  if n then
    return string.format("%02d", n)
  end

  return tostring(v)
end

_G.MARKET_TRACKER_SDK = _G.MARKET_TRACKER_SDK or {}
_G.MARKET_TRACKER_SDK.GetIdFromName = GetIdFromName
_G.MARKET_TRACKER_SDK.GetPriceFromName = function (name, trait, quality, platform)
    local byPlatform = true
    local byQuality = true
    local byTrait = true

    -- Capture our relevant shard.
    local internalId = GetIdFromName(name)
    local r = string.reverse(string.format("%06d", internalId))
    local s1, s2, s3 = r:sub(1,2), r:sub(3,4), r:sub(5,6)
    local shardFn = _G.MARKET_TRACKER_SDK["shard_" .. s1 .. s2]
    local shard = shardFn and shardFn(s3)
    if shard == nil then return end

    -- Collect platform data or fallback.
    local itemFn = shard(internalId)
    local item = itemFn and itemFn(platform)
    if item == nil and platform ~= "xbox-na" then
        -- Fallback to Xbox-NA prices if localized not available.
        item = itemFn and itemFn("xbox-na")
        byPlatform = false
    end
    if item == nil then return end

    -- Collect trait data or fallback.
    trait = _normalizeId(trait)
    if trait == "--" then
        byTrait = false
    end
    local traited = item[trait]
    if traited == nil then
        -- Fallback to traitless if traited not available.
        traited = item["--"]
        byTrait = false
    end
    if traited == nil then return end

    -- Collect quality data or fallback.
    quality = _normalizeId(quality)
    if quality == "--" then
        byQuality = false
    end
    local pricing = traited[quality]
    if pricing == nil then
        -- Fallback to qualityless if quality not available.
        pricing = traited["--"]
        byQuality = false
    end
    if pricing == nil then return end

    return {
        minimum=tonumber(pricing.minimum),
        maximum=tonumber(pricing.maximum),
        average=tonumber(pricing.average),
        commonQuantity=tonumber(pricing.commonQuantity),
        date=pricing.date
    }, byPlatform, byTrait, byQuality
end

local function _formatNumber(number)
    local i, j, minus, int, fraction = tostring(number):find('([-]?)(%d+)([.]?%d*)')
    int = int:reverse():gsub("(%d%d%d)", "%1,")
    return minus .. int:reverse():gsub("^,", "") .. fraction
end

_G.MARKET_TRACKER_SDK.GetFormattedPrice = function(price)
    return price and _formatNumber(price)
end