const ActiveCampaign = require('activecampaign')
var apiKey = null
var cache = []

var formatNumber = (number) => {
    var p = number.replace(/[^0-9\+]/ig,"")
    p = p.replace(/^00/, "")
    p = p.replace(/^\+/, "")
    p = "+"+p.replace(/^0/, "49")
    return p
}

var mapResult = (input) => {
    var data =[];
    Object.keys(input).forEach( key => {
        var element = input[key];
        if (typeof element.first_name !== "undefined") {
            data.push({
                "name": element.name,
                "phoneNumbers": [{
                    "label":"",
                    "phoneNumber":formatNumber(element.phone)
                }]
            })
        }
    })
    return data
}

var loadList = async (key, url) => {
    ac = new ActiveCampaign(url, key);
    var req = {"ids":"all", "full":1, "page":0, "sort": "id"}
    return ac.api("contact/list", req).then((data) => {
        var mapped = mapResult(data)
        return mapped
    })
}

var clearCache = (key) => {
    cache[key] = null
}

exports.getContactList = async function(key, url) {
    if (cache[key]) return cache[key]
    loadList(key, url).then((res) => {
        cache[key] = res
        return res
    })
    return []
}
