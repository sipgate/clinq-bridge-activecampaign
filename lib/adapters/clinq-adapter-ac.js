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
				unauthorized();
			}
		} catch (error) {
			unauthorized();
		}
	}

	async getContacts(page) {
		const options = { ids: "ALL", page, full: 1, sort: "id" };
		const data = await this.apiClient.api("contact/list", options);
		return {
			contacts: data,
			more: typeof data[19] !== "undefined",
			next_page: page + 1
		};
	}

	mapContacts(input) {
		const data = [];
		Object.keys(input)
			.then(key => input[key])
			.forEach(element => {
				if (typeof element.first_name !== "undefined" && element.phone !== "") {
					const number = new ClinqPhonenumber(element.phone);
					data.push({
						id: element.id,
						company: element.orgname || null,
						email: element.email || null,
						name: element.name,
						phoneNumbers: [
							{
								label: "",
								phoneNumber: number.e123Number()
							}
						]
					});
				}
			});
		return data;
	}
}

module.exports = ActiveCampaignAdapter;
