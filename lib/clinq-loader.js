const ClinqTools = require("./clinq-tools");

class ClinqLoader {
	constructor(adapter) {
		this.adapter = adapter;
		this.cache = [];
		this.fetchContacts = this.fetchContacts.bind(this);
		this.loadPage = this.loadPage.bind(this);
		this.loadList = this.loadList.bind(this);
	}

	async loadPage(page, buffer, client) {
		return client.getContacts(page).then(({ contacts, more, next_page }) => {
			if (!next_page) next_page++;

			const mapped = client.mapContacts(contacts).concat(buffer);
			if (more) {
				return this.loadPage(next_page, mapped, client);
			} else {
				return mapped;
			}
		});
	}

	async loadList(apiKey, apiUrl, client) {
		return this.loadPage(0, [], client);
	}

	async populateCache(apiKey, apiUrl) {
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

		const client = new this.adapter(apiUrl, apiKey);
		const anonKey = ClinqTools.anonymizeKey(apiKey);

		try {
			cacheEntry.loaded = false;

			await client.login();

			const list = await this.loadList(apiKey, apiUrl, client);

			console.log(`Filled cache: ${anonKey} (${list.length} contacts)`);

			this.cache[apiKey] = {
				loaded: true,
				list
			};
		} catch (error) {
			delete this.cache[apiKey];
			throw error;
		}
	}

	async fetchContacts(apiKey, apiUrl) {
		const anonKey = ClinqTools.anonymizeKey(apiKey);

		if (Object.keys(this.cache).includes(apiKey)) {
			console.log(`Responding from cache: ${anonKey} (${this.cache[apiKey].list.length} contacts)`);
			this.populateCache(apiKey, apiUrl);
			return this.cache[apiKey].list;
		}

		console.log("Preparing empty cache: " + ClinqTools.anonymizeKey(apiKey));

		this.populateCache(apiKey, apiUrl);
		return [];
	}
}

module.exports = ClinqLoader;
