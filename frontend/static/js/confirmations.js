document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('pendingContainer')
	let lastDataHash = ''

	const modal = document.getElementById('customConfirmModal')
	const msgElement = document.getElementById('confirmMessage')
	const btnConfirm = document.getElementById('btnConfirm')
	const btnCancel = document.getElementById('btnCancel')

	function showCustomConfirm(message, isDestructive = false) {
		return new Promise(resolve => {
			msgElement.textContent = message
			modal.classList.add('active')

			if (isDestructive) {
				btnConfirm.style.background = '#ef4444'
				btnConfirm.textContent = 'Отклонить'
			} else {
				btnConfirm.style.background = ''
				btnConfirm.textContent = 'Да, подтвердить'
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

	async function loadPendingUsers() {
		try {
			const res = await fetch(AppConfig.adminPendingUrl)
			if (res.status === 403) {
				window.location.href = '/dashboard'
				return
			}

			const users = await res.json()
			const currentDataHash = JSON.stringify(users)
			if (currentDataHash === lastDataHash) return
			lastDataHash = currentDataHash

			container.innerHTML = ''
			if (users.length === 0) {
				container.innerHTML =
					'<div style="color: #aaa; padding: 20px; text-align: center; grid-column: 1/-1;">Нет новых запросов 🎉</div>'
				return
			}

			users.forEach(u => {
				const div = document.createElement('div')
				div.className = 'pending-user-row'
				div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${u.avatar}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #facc15; object-fit: cover;">
                        <div>
                            <div style="font-weight: bold;">${u.username}</div>
                            <div style="font-size: 0.75rem; color: #aaa;">ID: ${u.discord_id}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-admin-action btn-deny" data-id="${u.discord_id}" data-name="${u.username}" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);">
                            ✕
                        </button>
                        <button class="btn-admin-action btn-approve" data-id="${u.discord_id}" data-name="${u.username}" style="background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.2);">
                            ✔
                        </button>
                    </div>
                `
				container.appendChild(div)
			})

			document.querySelectorAll('.btn-approve').forEach(btn => {
				btn.addEventListener('click', () =>
					processUser(btn.dataset.id, btn.dataset.name, 'approve'),
				)
			})
			document.querySelectorAll('.btn-deny').forEach(btn => {
				btn.addEventListener('click', () =>
					processUser(btn.dataset.id, btn.dataset.name, 'deny'),
				)
			})
		} catch (e) {
		}
	}

	async function processUser(id, username, action) {
		let confirmed = false
		let url = ''

		if (action === 'approve') {
			confirmed = await showCustomConfirm(
				`Выдать доступ пользователю ${username}?`,
				false,
			)
			url = AppConfig.adminApproveUrl
		} else {
			confirmed = await showCustomConfirm(
				`Отклонить доступ для ${username}?`,
				true,
			)
			url = AppConfig.adminDenyUrl
		}

		if (!confirmed) return

		try {
			await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user_id: id }),
			})
			lastDataHash = ''
			loadPendingUsers()
		} catch (e) {
			alert('Ошибка сети')
		}
	}

	loadPendingUsers()
	setInterval(loadPendingUsers, 3000)

	
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
