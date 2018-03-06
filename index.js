const Clinq = require("clinq-crm-bridge");
const AcClinq = require("./clinq-ac-adapter");

const adapter = {
    getContacts: async ({ apiKey, apiUrl }) => {
        return AcClinq.getContactList(apiKey, apiUrl)
    }
};

Clinq.start(adapter);
