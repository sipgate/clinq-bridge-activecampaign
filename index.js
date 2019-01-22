const Clinq = require("@clinq/bridge");
const ClinqLoader = require("./lib/clinq-loader");
const ClinqAdapter = require("./lib/adapters/clinq-adapter-ac");
const clinqLoader = new ClinqLoader(ClinqAdapter);

const adapter = {
	getContacts: async ({ apiKey, apiUrl }) => {
		const contacts = await clinqLoader.fetchContacts(apiKey, apiUrl);
		return contacts;
	},
	createContact: async ({ apiKey, apiUrl }, contact) => {
		const returnedContact = await clinqLoader.createContact(
			apiKey,
			apiUrl,
			contact
		);
		return returnedContact;
	}
};

Clinq.start(adapter);
