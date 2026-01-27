document.addEventListener('DOMContentLoaded', () => {
	const TICKET_ID = window.TicketConfig.ticketId
	const ADMIN_NAME = window.TicketConfig.adminName

	const chatBox = document.getElementById('chatBox')
	const modal = document.getElementById('customConfirmModal')
	const msgElement = document.getElementById('confirmMessage')
	const btnConfirm = document.getElementById('btnConfirm')
	const btnCancel = document.getElementById('btnCancel')

	marked.setOptions({ breaks: true, gfm: true })

	window.showCustomConfirm = function (message, isDestructive = false) {
		return new Promise(resolve => {
			msgElement.textContent = message
			modal.classList.add('active')

			if (isDestructive) {
				btnConfirm.style.background = '#ef4444'
				btnConfirm.textContent = 'Удалить'
			} else {
				btnConfirm.style.background = ''
				btnConfirm.textContent = 'Подтвердить'
			}

			const cleanup = () => {
				modal.classList.remove('active')
				btnConfirm.onclick = null
				btnCancel.onclick = null
			}

			btnConfirm.onclick = () => {
				cleanup()
				resolve(true)
			}
			btnCancel.onclick = () => {
				cleanup()
				resolve(false)
			}
		})
	}

	async function checkTicketStatus() {
		try {
			const res = await fetch('/dashboard/tickets/api/list')
			const tickets = await res.json()
			const currentTicket = tickets.find(
				t => t.ticket_id == TICKET_ID || t.id == TICKET_ID,
			)
			if (currentTicket && currentTicket.status === 'closed') {
				document.getElementById('btnClose').style.display = 'none'
				document.getElementById('btnDelete').style.display = 'inline-flex'
			}
		} catch (e) {}
	}
	checkTicketStatus()

	async function loadChatHistory() {
		try {
			await fetch('/dashboard/tickets/api/history/request', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ticket_id: TICKET_ID }),
			})

			let attempts = 0
			const poll = setInterval(async () => {
				attempts++
				const res = await fetch(`/dashboard/tickets/api/history/${TICKET_ID}`)
				const data = await res.json()

				if (data.status === 'ok') {
					clearInterval(poll)
					const loadingMsg = document.getElementById('loadingMsg')
					if (loadingMsg) loadingMsg.remove()
					chatBox.innerHTML = ''
					data.messages.forEach(msg => {
						const date = new Date(msg.time)
						const timeStr = date.toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						})
						appendMessage(
							msg.author,
							msg.avatar,
							msg.content,
							msg.is_admin,
							msg.embeds,
							timeStr,
						)
					})
					chatBox.scrollTop = chatBox.scrollHeight
				} else if (attempts > 10) clearInterval(poll)
			}, 1000)
		} catch (e) {
			console.error(e)
		}
	}
	loadChatHistory()

	function appendMessage(
		author,
		avatar,
		text,
		isAdmin,
		embeds = [],
		time = null,
	) {
		const div = document.createElement('div')
		div.className = `msg ${isAdmin ? 'admin' : ''}`
		const avatarUrl = avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'

		let contentHtml = ''
		if (text) {
			let md = text.replace(/\[File: (.*?)\]/g, '\n📄 [Вложение]($1)')
			contentHtml = `<div class="markdown-body">${marked.parse(md)}</div>`
		}

		let embedsHtml = ''
		if (embeds && embeds.length > 0) {
			embeds.forEach(emb => {
				const descHtml = emb.description ? marked.parse(emb.description) : ''
				let fieldsHtml = ''
				if (emb.fields) {
					fieldsHtml = '<div class="chat-embed-fields">'
					emb.fields.forEach(f => {
						fieldsHtml += `
                            <div class="chat-embed-field ${f.inline ? 'inline' : ''}">
                                <div class="chat-field-name">${f.name}</div>
                                <div class="chat-field-value markdown-body">${marked.parse(f.value)}</div>
                            </div>`
					})
					fieldsHtml += '</div>'
				}
				const footerHtml = emb.footer
					? `<div class="chat-embed-footer">${emb.footer}</div>`
					: ''
				const thumbHtml = emb.thumbnail
					? `<img src="${emb.thumbnail}" class="chat-embed-thumb">`
					: ''
				const imgHtml = emb.image
					? `<img src="${emb.image}" class="chat-embed-image">`
					: ''
				const titleHtml = emb.title
					? `<div class="chat-embed-title">${emb.title}</div>`
					: ''

				embedsHtml += `
                    <div class="chat-embed">
                        <div class="chat-embed-color" style="background-color: ${emb.color}"></div>
                        <div class="chat-embed-inner">
                            <div style="display:flex; justify-content: space-between;">
                                <div style="width: 100%;">
                                    ${titleHtml}
                                    <div class="chat-embed-desc markdown-body">${descHtml}</div>
                                    ${fieldsHtml}
                                </div>
                                ${thumbHtml}
                            </div>
                            ${imgHtml}
                            ${footerHtml}
                        </div>
                    </div>
                `
			})
		}

		div.innerHTML = `
            <img src="${avatarUrl}" class="msg-avatar">
            <div class="msg-content">
                <div class="msg-header">${author} <span style="font-weight:400; font-size: 0.7em; margin-left: 5px;">${time || ''}</span></div>
                ${contentHtml}
                ${embedsHtml}
            </div>
        `
		chatBox.appendChild(div)
		chatBox.scrollTop = chatBox.scrollHeight
	}

	window.sendReply = async function () {
		const input = document.getElementById('msgInput')
		const text = input.value.trim()
		if (!text) return

		await fetch('/api/control', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'admin_reply',
				data: { ticket_id: TICKET_ID, admin_name: ADMIN_NAME, text: text },
			}),
		})
		input.value = ''
	}

	window.handleEnter = function (e) {
		if (e.key === 'Enter') sendReply()
	}

	window.sendAction = async function (actionType) {
		let msg = 'Вы уверены?'
		let isDestructive = false

		if (actionType === 'delete_request') {
			msg =
				'Вы уверены, что хотите удалить тикет? Это действие нельзя отменить.'
			isDestructive = true
		} else if (actionType === 'close_request') {
			msg = 'Закрыть этот тикет?'
			isDestructive = false
		}

		const confirmed = await window.showCustomConfirm(msg, isDestructive)
		if (!confirmed) return

		await fetch('/api/control', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: actionType,
				data: { ticket_id: TICKET_ID },
			}),
		})
		if (actionType === 'delete_request')
			window.location.href = '/dashboard/tickets'
	}

	setInterval(async () => {
		try {
			const res = await fetch('/api/updates')
			const data = await res.json()
			if (typeof updateStatusIndicator === 'function')
				updateStatusIndicator(data.is_synced)

			if (data.ticket_events && data.ticket_events.length > 0) {
				data.ticket_events.forEach(event => {
					const p = event.data
					const pId = p.ticket_id || p.id

					if (event.type === 'new_message' && pId == TICKET_ID) {
						const date = new Date(p.time)
						const timeStr = date.toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						})

						const isMe = p.author === ADMIN_NAME || p.author === 'BotKwargsss'
						appendMessage(
							p.author,
							p.avatar,
							p.content,
							isMe,
							p.embeds,
							timeStr,
						)
					}

					if (
						event.type === 'ticket_updated' &&
						pId == TICKET_ID &&
						p.status === 'closed'
					) {
						document.getElementById('btnClose').style.display = 'none'
						document.getElementById('btnDelete').style.display = 'inline-flex'
					}
				})
			}
		} catch (e) {
			if (typeof updateStatusIndicator === 'function')
				updateStatusIndicator(false)
		}
	}, 1000)

	feather.replace()
})
