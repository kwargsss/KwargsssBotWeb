document.addEventListener('DOMContentLoaded', () => {
	feather.replace()

	const tableBody = document.getElementById('ticketsTable')

	function createTicketRow(t) {
		const tr = document.createElement('tr')
		const ticketId = t.ticket_id || t.id

		tr.className = 'ticket-row'
		tr.id = `ticket-${ticketId}`

		const typeClass = t.type === 'tech' ? 'type-tech' : 'type-server'
		const typeLabel = t.type === 'tech' ? 'TECH' : 'SERVER'

		let dateStr = t.created_at || 'Сейчас'
		if (dateStr.includes('-')) {
			try {
				const d = new Date(dateStr)
				dateStr =
					d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) +
					' ' +
					d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
			} catch (e) {}
		}

		const author = t.author || t.author_name || 'Неизвестно'

		tr.innerHTML = `
            <td style="font-family: 'JetBrains Mono'; color: #777;">#${ticketId}</td>
            <td><span class="badge-type ${typeClass}">${typeLabel}</span></td>
            <td>
                <span style="font-weight: 500; color: #e2e8f0;">${author}</span>
            </td>
            <td class="ticket-topic">${t.topic}</td>
            <td class="ticket-meta">${dateStr}</td>
            <td>
                <a href="/dashboard/tickets/${t.type}/${ticketId}" class="btn-primary small-btn" style="text-decoration: none; padding: 6px 12px; font-size: 0.85rem;">
                    Открыть
                </a>
            </td>
        `
		return tr
	}

	async function loadTickets() {
		try {
			const res = await fetch('/dashboard/tickets/api/list')
			if (!res.ok) throw new Error('API Error')

			const tickets = await res.json()
			tableBody.innerHTML = ''

			if (!tickets || tickets.length === 0) {
				tableBody.innerHTML =
					'<tr><td colspan="6" style="text-align: center; padding: 40px; color: #777;">Нет активных заявок</td></tr>'
			} else {
				tickets.forEach(t => {
					tableBody.appendChild(createTicketRow(t))
				})
			}
			feather.replace()
		} catch (e) {
			console.error(e)
		}
	}

	
	setInterval(loadTickets, 5000)

	
	setInterval(async () => {
		try {
			const res = await fetch('/api/updates')
			const data = await res.json()

			if (typeof updateStatusIndicator === 'function') {
				updateStatusIndicator(data.is_synced)
			}

			if (data.ticket_events && data.ticket_events.length > 0) {
				data.ticket_events.forEach(event => {
					const payload = event.data
					const tId = payload.id || payload.ticket_id

					if (event.type === 'ticket_created') {
						loadTickets()
					}

					if (
						event.type === 'ticket_updated' ||
						event.type === 'ticket_deleted'
					) {
						if (
							payload.status === 'closed' ||
							payload.status === 'deleted' ||
							event.type === 'ticket_deleted'
						) {
							const row = document.getElementById(`ticket-${tId}`)
							if (row) {
								row.classList.add('removing')
								setTimeout(() => {
									row.remove()
									if (tableBody.children.length === 0) {
										tableBody.innerHTML =
											'<tr><td colspan="6" style="text-align: center; padding: 40px; color: #777;">Нет активных заявок</td></tr>'
									}
								}, 300)
							}
						}
					}
				})
			}
		} catch (e) {
			if (typeof updateStatusIndicator === 'function')
				updateStatusIndicator(false)
		}
	}, 1000)

	loadTickets()
})
