document.addEventListener('DOMContentLoaded', () => {
	const elTableBody = document.querySelector('#dataTable tbody')
	const elTableHead = document.querySelector('#dataTable thead')
	const elSearch = document.getElementById('dbSearch')

	let tableData = []
	let searchFilter = ''

	function formatDuration(seconds) {
		if (!seconds || seconds <= 0)
			return '<span style="color: #10b981">Готово</span>'

		const h = Math.floor(seconds / 3600)
		const m = Math.floor((seconds % 3600) / 60)
		const s = Math.floor(seconds % 60)

		let result = []
		if (h > 0) result.push(`${h}ч`)
		if (m > 0) result.push(`${m}м`)
		result.push(`${s}с`)

		return result.join(' ')
	}

	
	window.requestTableUpdate = async function () {
		try {
			await fetch('/api/control', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'get_database',
					data: { table: CURRENT_TABLE },
				}),
			})
		} catch (e) {
			console.error(e)
		}
	}

	setInterval(requestTableUpdate, 5000)

	
	setInterval(async () => {
		try {
			const response = await fetch('/api/updates')
			if (!response.ok) {
				updateStatusIndicator(false)
				return
			}

			const result = await response.json()

			
			updateStatusIndicator(result.is_synced)

			
			if (result.new_logs && result.new_logs.length > 0) {
				result.new_logs.forEach(log => {
					if (log.type === 'db_response' && log.table === CURRENT_TABLE) {
						tableData = log.data
						applyFilterAndRender()
					}
				})
			}
		} catch (e) {
			updateStatusIndicator(false)
		}
	}, 1000)

	if (elSearch) {
		elSearch.addEventListener('input', e => {
			searchFilter = e.target.value.toLowerCase()
			applyFilterAndRender()
		})
	}

	function applyFilterAndRender() {
		if (!searchFilter) {
			renderTable(tableData)
			return
		}

		const filtered = tableData.filter(row => {
			return Object.values(row).some(val =>
				String(val).toLowerCase().includes(searchFilter),
			)
		})
		renderTable(filtered)
	}

	function renderTable(data) {
		elTableBody.innerHTML = ''
		elTableHead.innerHTML = ''

		if (!data || data.length === 0) {
			elTableBody.innerHTML =
				'<tr><td colspan="100" style="text-align:center; padding: 20px; color: var(--text-muted);">Нет данных</td></tr>'
			return
		}

		const keys = Object.keys(data[0])
		let headRow = '<tr>'
		keys.forEach(k => (headRow += `<th>${k}</th>`))
		headRow += '</tr>'
		elTableHead.innerHTML = headRow

		let bodyHtml = ''
		data.forEach(row => {
			bodyHtml += '<tr>'
			keys.forEach(k => {
				let val = row[k]
				if (val === null || val === undefined) val = '-'

				if (k === 'User') {
					val = `<span style="color: #fff; font-weight: 500;">${val}</span>`
				}

				if (k === 'Time Left' && typeof val === 'number') {
					val = `<span style="font-family: 'JetBrains Mono', monospace; color: #a78bfa;">${formatDuration(val)}</span>`
				}

				if (
					typeof val === 'string' &&
					val.length > 60 &&
					!val.includes('<span')
				) {
					val = `<span title="${val}">${val.substring(0, 60)}...</span>`
				}
				bodyHtml += `<td>${val}</td>`
			})
			bodyHtml += '</tr>'
		})
		elTableBody.innerHTML = bodyHtml
	}

	requestTableUpdate()
})
