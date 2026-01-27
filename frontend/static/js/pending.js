document.addEventListener('DOMContentLoaded', () => {
	const btnReload = document.getElementById('btnReload')

	if (btnReload) {
		btnReload.addEventListener('click', () => {
			location.reload()
		})
	}

	
	setInterval(async () => {
		try {
			const response = await fetch(AppConfig.updatesUrl)
			const result = await response.json()
			updateStatusIndicator(result.is_synced)
		} catch (e) {
			updateStatusIndicator(false)
		}
	}, 2000)
})
