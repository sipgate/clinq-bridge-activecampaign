const ActiveCampaign = require("activecampaign");
const { unauthorized } = require("@clinq/bridge");
const ClinqPhonenumber = require("../clinq-phonenumber");

class ActiveCampaignAdapter {
	constructor(apiUrl, apiKey) {
		this.apiClient = new ActiveCampaign(apiUrl, apiKey);
		this.getContacts = this.getContacts.bind(this);
		this.mapContacts = this.mapContacts.bind(this);
	}

	async login() {
		try {
			const result = await this.apiClient.credentials_test();
			if (!result.success) {
				throw new Error();
			}
		} catch (error) {
			unauthorized();
		}
	}

	async getContacts(page) {
		const options = { ids: "all", page, full: 1, sort: "id" };
		const data = await this.apiClient.api("contact/list", options);
		return {
			contacts: data,
			more: typeof data[19] !== "undefined",
			next_page: page + 1
		};
	}

	mapContacts(input) {
		return Object.keys(input)
			.map(key => input[key])
			.filter(entry => entry.name && entry.phone)
			.map(contact => {
				const number = new ClinqPhonenumber(contact.phone);
				return {
					id: contact.id,
					company: contact.orgname || null,
					email: contact.email || null,
					name: contact.name,
					contactUrl: null,
					avatarUrl: null,
					phoneNumbers: [
						{
							label: null,
							phoneNumber: number.e123Number()
						}
					]
				};
			});
	}
}

module.exports = ActiveCampaignAdapter;
