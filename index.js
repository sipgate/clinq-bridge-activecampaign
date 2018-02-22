const Clinq = require("clinq-crm-bridge");
const ActiveCampaign = require("activecampaign");

var ac
var cache = {}

function map(input) {
    var data =[];
    Object.keys(input).forEach( key => {
        var element = input[key];
        if (typeof element.first_name !== "undefined") {
            var p = element.phone.replace(/[^0-9\+]/ig,"")
            p = p.replace(/^00/, "")
            p = p.replace(/^\+/, "")
            p = p.replace(/^0/, "49")
            if (p != "")
            data.push({
                "name": element.name,
                "phoneNumbers": {
                    "label":"phone",
                    "phoneNumber":p
                }
            })
        }
    })
    return data
}

var allContacts = [];
var page=1;

function fetchContacts(previous) {
    return new Promise((resolve, reject) => {
        if (previous != null && Object.keys(previous).length<6) {
            return resolve(allContacts)
        }
        if (previous != null) {
            var cnt = map(previous);
            allContacts = allContacts.concat(cnt)
        }
        var req = {"ids":"all", "full":1, "page":page++, "sort": "id"}
        return ac.api("contact/list", req).then((data) => {
            resolve(fetchContacts(data))
        })
    })
}

function fetchAllContacts() {
    return fetchContacts(null)
}

const adapter = {
    getContacts: function(apikey) {
        ac = new ActiveCampaign("https://sipgate.api-us1.com", apikey);
        return fetchAllContacts()
    }
};
    
Clinq.start(adapter);
