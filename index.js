const axios = require("axios");
const { start, ServerError } = require("@clinq/bridge");

const cache = new Map();

function anonymizeKey(apiKey) {
	return "********" + apiKey.substr(apiKey.length - 5);
}

function createClient(apiKey, apiUrl) {
	if (typeof apiKey !== "string") {
		throw new Error("Invalid API key.");
	}
	return axios.create({
		baseURL: `${apiUrl}/api/3`,
		headers: { "Api-Token": apiKey }
	});
}

function convertToClinqContact(contact) {
	return {
		id: contact.id,
		company: contact.organization || null,
		email: contact.email || null,
		name: null,
		firstName: contact.firstName,
		lastName: contact.lastName,
		contactUrl: null,
		avatarUrl: null,
		phoneNumbers: [
			{
				label: null,
				phoneNumber: contact.phone
			}
		]
	};
}

function convertToActiveCampaignContact(clinqContact) {
	return {
		contact: {
			email: clinqContact.email,
			firstName: clinqContact.firstName,
			lastName: clinqContact.lastName,
			phone: clinqContact.phoneNumbers[0].phoneNumber,
			organization: clinqContact.company
		}
	};
}

async function populateCache(apiKey, client) {
	try {
		const contacts = await getAllActiveCampaignContacts(client);
		const convertedContacts = contacts
			.filter(contact => contact.phone)
			.map(contact => convertToClinqContact(contact));

		cache.set(apiKey, convertedContacts);
	} catch (error) {
		console.error(error.message);
	}
}

async function getAllActiveCampaignContacts(client, contacts = []) {
	let options = {
		params: {
			limit: 100
		}
	};
	if (contacts.length > 0) {
		options = {
			params: {
				offset: contacts.length,
				limit: 100
			}
		};
	}
	const response = await client.get("/contacts", options);

	const merged = [...contacts, ...response.data.contacts];

	if (merged.length >= response.data.meta.total) {
		return merged;
	}
	return getAllActiveCampaignContacts(client, merged);
}

async function createActiveCampaignContact(client, newContact) {
	const activeCampaignContact = convertToActiveCampaignContact(newContact);

	const response = await client.post("/contacts", activeCampaignContact);

	if (!response.data.contact) {
		throw new Error(
			"Could not create contact",
			response.errors ? response.errors : response.message
		);
	}

	return response.data.contact;
}

async function updateActiveCampaignContact(client, id, updatedContact) {
	const activeCampaignContact = convertToActiveCampaignContact(updatedContact);

	const response = await client.put("/contacts/" + id, activeCampaignContact);

	if (!response.data.contact) {
		throw new Error(
			"Contact not found",
			response.errors ? response.errors : response.message
		);
	}

	return response.data.contact;
}

const adapter = {
	getContacts: async ({ apiKey, apiUrl }) => {
		try {
			const client = createClient(apiKey, apiUrl);
			populateCache(apiKey, client);
		} catch (error) {
			console.error(
				`Could not get contacts for key "${anonymizeKey(apiKey)}"`,
				error.message
			);
			throw new ServerError(401, "Unauthorized");
		}

		console.log(cache.size);

		const contacts = cache.get(apiKey);

		if (contacts) {
			console.log(contacts);
			return contacts;
		}

		return [];
	},
	createContact: async ({ apiKey, apiUrl }, newContact) => {
		try {
			const client = createClient(apiKey, apiUrl);
			const activeCampaignContact = await createActiveCampaignContact(
				client,
				newContact
			);

			return convertToClinqContact(activeCampaignContact);
		} catch (error) {
			console.error(
				`Could not create contact for key "${anonymizeKey(apiKey)}: ${
					error.message
				}"`
			);
			throw new ServerError(400, "Could not create contact");
		}
	},
	updateContact: async ({ apiKey, apiUrl }, id, updatedContact) => {
		try {
			const client = createClient(apiKey, apiUrl);
			const activeCampaignContact = await updateActiveCampaignContact(
				client,
				id,
				updatedContact
			);

			return convertToClinqContact(activeCampaignContact);
		} catch (error) {
			console.error(
				`Could not update contact for key "${anonymizeKey(apiKey)}: ${
					error.message
				}"`
			);
			throw new ServerError(400, "Could not update contact");
		}
	},
	deleteContact: async ({ apiKey, apiUrl }, id) => {
		try {
			const client = createClient(apiKey, apiUrl);
			await client.delete("/contacts/" + id);
		} catch (error) {
			console.error(
				`Could not delete contact for key "${anonymizeKey(apiKey)}: ${
					error.message
				}"`
			);
			throw new ServerError(404, "Could not delete contact");
		}
	}
};

start(adapter);
