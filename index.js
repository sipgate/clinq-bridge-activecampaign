const Clinq = require("clinq-crm-bridge");
const AcClinq = require("./clinq-ac-adapter");

const adapter = {
<<<<<<< HEAD
	getContacts: async ({ apiKey, apiUrl }) => {
        return AcClinq.getContactList(apiKey, apiUrl)
	}
};

Clinq.start(adapter);
=======
    getContacts: function({apiKey, apiUrl}) {
        ac = new ActiveCampaign(apiUrl, apiKey);
        return fetchAllContacts()
    }
};

Clinq.start(adapter);
>>>>>>> a36adbb46373e5b7e9472199e14dbb14aad65c72
