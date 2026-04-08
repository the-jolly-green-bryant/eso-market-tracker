local GetPlatform = function ()
    return ({
        ["XB1live"] = "xbox-na",
        ["NA Megaserver"] = "xbox-na",
        ["EU Megaserver"] = "xbox-eu",
        ["PTS"] = "xbox-na",
        ["XB1live-eu"] = "xbox-eu",
        ["PS4live"] = "ps-na",
        ["PS4live-eu"] = "ps-eu",
    })[GetWorldName()] or "xbox-na"
end

local GetPriceFromLink = function (link)
    local pricing, byPlatform, byTrait, byQuality, debug = _G.MARKET_TRACKER_SDK.GetPriceFromName(
        GetItemLinkName(link),
        GetItemLinkTraitInfo(link),
        GetItemLinkDisplayQuality(link),
        GetPlatform()
    )

    local source = ""
    if byTrait and byQuality then
        source = "based on trait and quality"
    elseif byTrait then
        source = "based on trait"
    elseif byQuality then
        source = "based on quality"
    end

    return (pricing and pricing.average), source, debug
end

local CalculateSellPrice = function (bagId, slotIndex)
    local link = GetItemLink(bagId, slotIndex)
    local _, count = GetItemInfo(bagId, slotIndex)
    local price = GetPriceFromLink(link)
    return (price and price * count) or 0
end
ZO_TradingHouse_CalculateItemSuggestedPostPrice = CalculateSellPrice

local Original_AddItemTitle = ZO_Tooltip.AddItemTitle
function ZO_Tooltip:AddItemTitle(itemLink, name)
    Original_AddItemTitle(self, itemLink, name)
    if itemLink == nil then return end


    local rawPrice, source, debug = GetPriceFromLink(itemLink)
    local price = _G.MARKET_TRACKER_SDK.GetFormattedPrice(rawPrice)

    self:AddLine(
        string.format(
            "Market Price: |cFFD700%s|r |t48:48:EsoUI/Art/currency/gamepad/gp_gold_64.dds|t|r",
            price or "Unknown"
        ),
        self:GetStyle("bodyDescription")
    )

    _ = _G.MARKET_TRACKER_SDK.DEBUG and self:AddLine(
        string.format(_G.MARKET_TRACKER_SDK.Stringify(debug)),
        self:GetStyle("statValuePairStat")
    )


    if source == "" then return end
    self:AddLine(
        string.format(" (%s)", source),
        self:GetStyle("statValuePairStat")
    )
end

local function OnAddOnLoaded(event, addonName)
    if addonName ~= "MarketTracker" then return end
    EVENT_MANAGER:UnregisterForEvent("MarketTracker", EVENT_ADD_ON_LOADED)
    zo_callLater(function()
        ZO_TradingHouse_CalculateItemSuggestedPostPrice = CalculateSellPrice
    end, 5000)
end

EVENT_MANAGER:RegisterForEvent("MarketTracker", EVENT_ADD_ON_LOADED, OnAddOnLoaded)