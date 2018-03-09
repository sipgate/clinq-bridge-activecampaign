const ActiveCampaign = require('activecampaign')
const ClinqPhonenumber = require('../clinq-phonenumber')

class ActiveCampaignAdapter {
    constructor(apiUrl, apiKey) {
        this.apiClient = new ActiveCampaign(apiUrl, apiKey)
        this.getContacts = this.getContacts.bind(this)
        this.mapContacts = this.mapContacts.bind(this)
    }

    login() {
        return new Promise((resolve, reject) => {
            return this.apiClient.api("branding/view", {}).then((data) => {
                if (data.success == 1) {
                    resolve()
                } else {
                    reject(new Error(401))
                }
            })
        })
    }

    getContacts(page) {
        return new Promise((resolve, reject) => {
            var options = {"ids":"all", "full":1, "page":page, "sort": "id"}
            return this.apiClient.api("contact/list", options).then((data) => {
                return resolve({"contacts":data, "more": typeof data[19]!=="undefined", "next_page":page+1})
            })
        })
    }

    mapContacts(input) {
        var data =[];
        Object.keys(input).forEach( key => {
            var element = input[key];
            if (typeof element.first_name !== "undefined" && element.phone!=="") {
                var number = new ClinqPhonenumber(element.phone)
                data.push({
                    "name": element.name,
                    "phoneNumbers": [{
                        "label":"",
                        "phoneNumber":number.e123Number()
                    }]
                })
            }
        })
        return data
    }
}

module.exports = ActiveCampaignAdapter