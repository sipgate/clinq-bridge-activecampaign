const ClinqTools = require("./clinq-tools");

class ClinqLoader {
	constructor(adapter) {
		this.adapter = adapter;
		this.cache = [];
		this.fetchContacts = this.fetchContacts.bind(this);
		this.loadPage = this.loadPage.bind(this);
		this.loadList = this.loadList.bind(this);
		this.populateCache = this.populateCache.bind(this);
	}

	async loadPage(page, buffer, client) {
		const { contacts, more, next_page } = await client.getContacts(page);

		if (!next_page) {
			next_page++;
		}

		const mapped = client.mapContacts(contacts).concat(buffer);

		if (more) {
			return this.loadPage(next_page, mapped, client);
		} else {
			return mapped;
		}
	}

	loadList(client) {
		return this.loadPage(0, [], client);
	}

	async populateCache(client, apiKey) {
		if (!this.cache[apiKey]) {
			this.cache[apiKey] = {
				loaded: true,
				list: []
			};
		}
		const cacheEntry = this.cache[apiKey];
		if (!cacheEntry || !cacheEntry.loaded) {
			return;
		}

		try {
			cacheEntry.loaded = false;

			const list = await this.loadList(client);

			console.log(
				`Filled cache: ${ClinqTools.anonymizeKey(apiKey)} (${
					list.length
				} contacts)`
			);

			this.cache[apiKey] = {
				loaded: true,
				list
			};
		} catch (error) {
			delete this.cache[apiKey];
		}
	}

	async fetchContacts(apiKey, apiUrl) {
		const client = new this.adapter(apiUrl, apiKey);

		await client.login();

		const anonKey = ClinqTools.anonymizeKey(apiKey);

		console.log(`Preparing empty cache: ${anonKey}`);

		this.populateCache(client, apiKey);
		return this.cache[apiKey] ? this.cache[apiKey].list : [];
	}

	async createContact(apiKey, apiUrl, contact) {
		const client = new this.adapter(apiUrl, apiKey);

		await client.login();

		const returnedContact = await client.createContact(contact);

		return returnedContact;
	}
}

module.exports = ClinqLoader;
