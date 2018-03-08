const ActiveCampaign = require('activecampaign')
const HARD_MAX=40000
var apiKey = null
var cache = []
var cached_keys = []

var formatNumber = (number) => {
    var p = number.replace(/[^0-9\+]/ig,"")
    p = p.replace(/^00/, "")
    p = p.replace(/^\+/, "")
    p = "+"+p.replace(/^0/, "49")
    return p
}

var keyOut = (key) => {
    return "********" +key.substr(key.length - 5)
}

var mapResult = (input) => {
    var data =[];
    Object.keys(input).forEach( key => {
        var element = input[key];
        if (typeof element.first_name !== "undefined" && element.phone!=="") {
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

var getAllPromise = (client, params) => {
    return new Promise((resolve, reject) => {
        return ac.api("contact/list", params).then((data) => {
            resolve({"contacts":data, "info":{}})
        })
    })
}

var loadPage = async (page, cache, client) => {
    var options = {"ids":"all", "full":1, "page":page, "sort": "id"}
    return getAllPromise(client, options).then((data) => {
        var mapped = mapResult(data.contacts).concat(cache)
        if (typeof data.contacts[19]!=="undefined" && mapped.length <= HARD_MAX) {
            return loadPage(page+1, mapped)
        } else {
            return mapped
        }
    })
}
var loadList = async (key, url) => {
    ac = new ActiveCampaign(url, key);
    //pipedriveClient = new Pipedrive.Client(key, { strictMode: true });
    return loadPage(0, [], ac)
}

var clearCache = (key) => {
    cache[key] = null
}

exports.getContactList = async function(key, url) {
    if (cached_keys.includes(key)) {
        console.log("Responding from cache: "+keyOut(key)+" ("+cache[key].length+" contacts)")
        return cache[key]
    }
    console.log("Preparing empty cache: "+keyOut(key))
    cache[key] = []
    cached_keys.push(key)
    loadList(key, url).then((apiResponse) => {
        console.log("Filled cache: "+keyOut(key)+" ("+apiResponse.length+" contacts)")
        cache[key] = apiResponse
        return apiResponse
    })
    return []
}






