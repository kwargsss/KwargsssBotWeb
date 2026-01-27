document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('deniedContainer')
	const searchInput = document.getElementById('searchInput')

	let allDeniedUsers = []

	const modal = document.getElementById('customConfirmModal')
	const msgElement = document.getElementById('confirmMessage')
	const btnConfirm = document.getElementById('btnConfirm')
	const btnCancel = document.getElementById('btnCancel')

	function showCustomConfirm(message) {
		return new Promise(resolve => {
			msgElement.textContent = message
			modal.classList.add('active')

			btnConfirm.style.background = '#10b981'
			btnConfirm.textContent = 'Восстановить'

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

	function renderUsers(users) {
		container.innerHTML = ''

		if (users.length === 0) {
			container.innerHTML =
				'<div style="color: #aaa; padding: 20px; text-align: center; grid-column: 1/-1;">Список пуст</div>'
			return
		}

		users.forEach(u => {
			const div = document.createElement('div')
			div.className = 'pending-user-row'
			div.style.borderColor = 'rgba(239, 68, 68, 0.3)'

			div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${u.avatar}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #ef4444; object-fit: cover; opacity: 0.7;">
                    <div>
                        <div style="font-weight: bold; color: #f87171; text-decoration: line-through;">${u.username}</div>
                        <div style="font-size: 0.75rem; color: #aaa;">ID: ${u.discord_id}</div>
                    </div>
                </div>
                
                <button class="btn-restore" data-id="${u.discord_id}" data-name="${u.username}" style="background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.2); padding: 5px 15px; border-radius: 8px; cursor: pointer; transition: 0.2s;">
                    Вернуть доступ
                </button>
            `
			container.appendChild(div)
		})

		document.querySelectorAll('.btn-restore').forEach(btn => {
			btn.addEventListener('click', () =>
				restoreUser(btn.dataset.id, btn.dataset.name),
			)
		})
	}

	async function loadDeniedUsers() {
		try {
			const res = await fetch(AppConfig.adminDeniedListUrl)
			if (res.status === 403) {
				window.location.href = '/dashboard'
				return
			}

			allDeniedUsers = await res.json()
			renderUsers(allDeniedUsers)
		} catch (e) {
		}
	}

	async function restoreUser(id, username) {
		const confirmed = await showCustomConfirm(
			`Вернуть доступ пользователю ${username}?`,
		)
		if (!confirmed) return

		try {
			await fetch(AppConfig.adminApproveUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user_id: id }),
			})
			loadDeniedUsers()
		} catch (e) {
			alert('Ошибка сети')
		}
	}

	searchInput.addEventListener('input', e => {
		const val = e.target.value.toLowerCase()
		const filtered = allDeniedUsers.filter(u =>
			u.username.toLowerCase().includes(val),
		)
		renderUsers(filtered)
	})

	loadDeniedUsers()

	
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
