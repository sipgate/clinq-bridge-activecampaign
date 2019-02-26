const axios = require("axios");
const { start, ServerError } = require("@clinq/bridge");

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

function convertToClinqContact(contact, organizations) {
	const phoneNumbers = contact.phone
		? [
				{
					label: "WORK",
					phoneNumber: contact.phone
				}
		  ]
		: [];
	return {
		id: contact.id,
		organization: organizations
			? getOrganizationById(organizations, contact.orgid)
			: null,
		email: contact.email || null,
		name: null,
		firstName: contact.firstName,
		lastName: contact.lastName,
		contactUrl: null,
		avatarUrl: null,
		phoneNumbers
	};
}

function getOrganizationById(organizations, id) {
	const organization = organizations.filter(
		organization => organization.id === id
	);
	return organization[0] ? organization[0].name : null;
}

function convertToActiveCampaignContact(clinqContact) {
	const phone = clinqContact.phoneNumbers[0]
		? clinqContact.phoneNumbers[0].phoneNumber
		: null;
	return {
		contact: {
			email: clinqContact.email,
			firstName: clinqContact.firstName,
			lastName: clinqContact.lastName,
			phone
		}
	};
}

async function getAllActiveCampaignEntities(client, endpoint, entities = []) {
	let options = {
		params: {
			limit: 100,
			forceQuery: 1
		}
	};
	if (entities.length > 0) {
		options = {
			params: {
				offset: entities.length,
				limit: 100,
				forceQuery: 1
			}
		};
	}
	const response = await client.get("/" + endpoint, options);

	const merged = [...entities, ...response.data[endpoint]];

	if (merged.length >= response.data.meta.total) {
		return merged;
	}
	return getAllActiveCampaignEntities(client, endpoint, merged);
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
		let client;

		try {
			client = createClient(apiKey, apiUrl);
		} catch (error) {
			console.error(
				`Could not get contacts for key "${anonymizeKey(apiKey)}"`,
				error.message
			);
			throw new ServerError(401, "Unauthorized");
		}

		try {
			const organizations = await getAllActiveCampaignEntities(
				client,
				"organizations"
			);
			const contacts = await getAllActiveCampaignEntities(client, "contacts");
			return contacts.map(contact =>
				convertToClinqContact(contact, organizations)
			);
		} catch (error) {
			console.error(error.message);
			return null;
		}
	},
	createContact: async ({ apiKey, apiUrl }, newContact) => {
		try {
			const client = createClient(apiKey, apiUrl);
			const activeCampaignContact = await createActiveCampaignContact(
				client,
				newContact
			);

			const organizations = await getAllActiveCampaignEntities(
				client,
				"organizations"
			);

			return convertToClinqContact(activeCampaignContact, organizations);
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

			const organizations = await getAllActiveCampaignEntities(
				client,
				"organizations"
			);

			return convertToClinqContact(activeCampaignContact, organizations);
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
