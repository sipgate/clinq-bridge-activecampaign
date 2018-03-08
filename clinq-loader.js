//var Adapter=require('./adapter')

class ClinqLoader {
    constructor(adapter) {
        this.adapter = adapter
        this.cache = []
        this.fetchContacts = this.fetchContacts.bind(this)
        this.loadPage = this.loadPage.bind(this)
        this.loadList = this.loadList.bind(this)
    }
    
    static anonymizeKey(apiKey) {
        return "********" +apiKey.substr(apiKey.length - 5)
    }

    async loadPage(page, buffer, client) {
        return client.getContacts(page).then(({contacts, more}) => {
            var mapped = client.mapContacts(contacts).concat(buffer)
            if (more) {
                return this.loadPage(page+1, mapped, client)
            } else {
                return mapped
            }
        })
    }

    async loadList(apiKey, apiUrl, client) {
        return this.loadPage(0, [], client)
    }

    async fetchContacts(apiKey, apiUrl) {
        if (Object.keys(this.cache).includes(apiKey)) {
            console.log("Responding from cache: "+ClinqLoader.anonymizeKey(apiKey)+" ("+this.cache[apiKey].length+" contacts)")
            return this.cache[apiKey]
        }

        console.log("Preparing empty cache: "+ClinqLoader.anonymizeKey(apiKey))
        this.cache[apiKey] = []
        var client = new this.adapter(apiUrl, apiKey);
        return client.login().then(() => {
            this.loadList(apiKey, apiUrl, client).then((apiResponse) => {
                console.log("Filled cache: "+ClinqLoader.anonymizeKey(apiKey)+" ("+apiResponse.length+" contacts)")
                this.cache[apiKey] = apiResponse
                return apiResponse
            })
            return []
        }).catch((e) => {
            delete this.cache[apiKey]
            throw(e)
        })
    }
}

module.exports = ClinqLoader
/*
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

var loadPage = async (page, cache, client) => {
    return client.getContacts(page).then(({contacts, more}) => {
        var mapped = client.mapContacts(contacts).concat(cache)
        if (more && mapped.length <= HARD_MAX) {
            return loadPage(page+1, mapped, client)
        } else {
            return mapped
        }
    })
}

var loadList = async (apiKey, apiUrl) => {
    var client = new Adapter(apiUrl, apiKey);
    return client.login().then(() => {
        return loadPage(0, [], client)
    })
}

var clearCache = (key) => {
    cache[key] = null
}

exports.getContactList = function(apiKey, apiUrl) {
    if (cached_keys.includes(apiKey)) {
        console.log("Responding from cache: "+keyOut(apiKey)+" ("+cache[apiKey].length+" contacts)")
        return cache[apiKey]
    }
    console.log("Preparing empty cache: "+keyOut(apiKey))
    cache[apiKey] = []
    cached_keys.push(apiKey)
    loadList(apiKey, apiUrl).then((apiResponse) => {
        console.log("Filled cache: "+keyOut(apiKey)+" ("+apiResponse.length+" contacts)")
        cache[apiKey] = apiResponse
        return apiResponse
    })
    return []
}

*/




