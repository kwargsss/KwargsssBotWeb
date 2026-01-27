document.addEventListener('DOMContentLoaded', () => {
	
	async function startStatusLoop() {
		setInterval(async () => {
			try {
				const response = await fetch(AppConfig.updatesUrl)
				const result = await response.json()
				updateStatusIndicator(result.is_synced)
			} catch (e) {
				updateStatusIndicator(false)
			}
		}, 2000)
	}

	startStatusLoop()
})
