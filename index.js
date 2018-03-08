const Clinq = require("clinq-crm-bridge");
const ClinqLoader = require("./clinq-loader");
const ClinqAdapterActiveCampaign = require("./clinq-adapter-ac");
const clinqLoader = new ClinqLoader(ClinqAdapterActiveCampaign)

const adapter = {
	getContacts: async ({ apiKey, apiUrl }) => {
        return clinqLoader.fetchContacts(apiKey, apiUrl)
	}
};

Clinq.start(adapter);
