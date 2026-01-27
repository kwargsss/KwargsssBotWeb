document.addEventListener('DOMContentLoaded', () => {
	feather.replace()

	const tableBody = document.getElementById('archiveTable')

	function createArchiveRow(t) {
		const tr = document.createElement('tr')
		tr.className = 'ticket-row'

		const typeClass = t.type === 'tech' ? 'type-tech' : 'type-server'
		const typeLabel = t.type === 'tech' ? 'TECH' : 'SERVER'

		let dateStr = t.created_at || '-'
		try {
			const d = new Date(dateStr)
			dateStr =
				d.toLocaleDateString('ru-RU', {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
				}) +
				' ' +
				d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		} catch (e) {}

		const author = t.author || 'Неизвестно'
		const avatar = t.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'

		tr.innerHTML = `
            <td style="font-family: 'JetBrains Mono'; color: #777;">#${t.ticket_id}</td>
            <td><span class="badge-type ${typeClass}">${typeLabel}</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${avatar}" style="width: 24px; height: 24px; border-radius: 50%;">
                    <span style="font-weight: 500; color: #e2e8f0;">${author}</span>
                </div>
            </td>
            <td class="ticket-topic">${t.topic}</td>
            <td class="ticket-meta">${dateStr}</td>
            <td>
                <a href="${t.url}" target="_blank" class="btn-primary small-btn" style="text-decoration: none; padding: 6px 12px; font-size: 0.85rem; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">
                    <i data-feather="external-link" style="width: 14px;"></i> Открыть
                </a>
            </td>
        `
		return tr
	}

	async function loadArchive() {
		try {
			const res = await fetch('/dashboard/tickets/api/archive_list')

			if (!res.ok) {
				throw new Error(`Ошибка сервера: ${res.status}`)
			}

			const tickets = await res.json()
			tableBody.innerHTML = ''

			if (!tickets || tickets.length === 0) {
				tableBody.innerHTML =
					'<tr><td colspan="6" style="text-align: center; padding: 40px; color: #777;">Архив пуст или данные загружаются...</td></tr>'
			} else {
				tickets.forEach(t => {
					tableBody.appendChild(createArchiveRow(t))
				})
				feather.replace()
			}
		} catch (e) {
			if (tableBody.children.length <= 1) {
				tableBody.innerHTML =
					'<tr><td colspan="6" style="text-align: center; padding: 40px; color: #ef4444;">Не удалось загрузить список</td></tr>'
			}
		}
	}

	setInterval(async () => {
		try {
			const res = await fetch('/api/updates')
			const data = await res.json()
			if (typeof updateStatusIndicator === 'function') {
				updateStatusIndicator(data.is_synced)
			}
		} catch (e) {
			if (typeof updateStatusIndicator === 'function')
				updateStatusIndicator(false)
		}
	}, 1000)

	loadArchive()
	setInterval(loadArchive, 2000)
})
