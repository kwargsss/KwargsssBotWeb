
const AppConfig = {
	apiUrl: window.location.origin + '/api/control',
	infoUrl: window.location.origin + '/api/info',
	updatesUrl: window.location.origin + '/api/updates',
	adminPendingUrl: window.location.origin + '/api/admin/pending_users',
	adminApproveUrl: window.location.origin + '/api/admin/approve',
	adminDenyUrl: window.location.origin + '/api/admin/deny',
	adminDeniedListUrl: window.location.origin + '/api/admin/denied_users',
}


let offlineStrikes = 0 
const MAX_STRIKES = 3 

function systemLog(msg, type = 'info') {
	const consoleDiv = document.getElementById('consoleLogs')
	if (consoleDiv) {
		const time = new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		})

		const entry = document.createElement('div')
		entry.className = 'log-entry'

		const timeSpan = document.createElement('span')
		timeSpan.className = 'log-time'
		timeSpan.textContent = time

		let colorClass = 'log-info'
		if (type === 'success') colorClass = 'log-success'
		if (type === 'error') colorClass = 'log-error'

		msgSpan.className = colorClass
		msgSpan.textContent = msg

		entry.appendChild(timeSpan)
		entry.appendChild(document.createTextNode(' '))
		entry.appendChild(msgSpan)
		
		consoleDiv.appendChild(entry)
		consoleDiv.scrollTop = consoleDiv.scrollHeight
	}
	console.log(`[${type.toUpperCase()}] ${msg}`)
}

function updateStatusIndicator(isOnline) {
	const dot = document.getElementById('statusIndicator')
	const badge = document.getElementById('statusBadge')
	const text = document.getElementById('statusText')

	
	if (!dot) return

	if (isOnline) {
		
		offlineStrikes = 0 

		dot.classList.remove('offline')
		if (badge) badge.classList.remove('offline')
		if (text) text.textContent = 'Бот онлайн'
	} else {
		
		dot.classList.add('offline')
		if (badge) badge.classList.add('offline')
		if (text) text.textContent = 'Нет связи'

		
		offlineStrikes++

		
		if (offlineStrikes >= MAX_STRIKES) {
			
			if (window.location.pathname !== '/bot-offline') {
				window.location.href = '/bot-offline'
			}
		}
	}
}
