document.addEventListener('DOMContentLoaded', () => {
	
	const elTotalUsers = document.getElementById('statTotalUsers')
	const elOnlineUsers = document.getElementById('statOnlineUsers')
	const elDailyMsg = document.getElementById('statDailyMsg')
	const elDailyCmd = document.getElementById('statDailyCmd')
	const elActivityList = document.getElementById('activityList')

	
	const elSysCpuVal = document.getElementById('sysCpuVal')
	const elSysCpuBar = document.getElementById('sysCpuBar')
	const elSysRamVal = document.getElementById('sysRamVal')
	const elSysRamBar = document.getElementById('sysRamBar')
	const elSysPingVal = document.getElementById('sysPingVal')
	const elSysPingBar = document.getElementById('sysPingBar')

	let activityChart = null

	
	function initChart(data) {
		const ctx = document.getElementById('activityChart').getContext('2d')
		const gradientMsg = ctx.createLinearGradient(0, 0, 0, 400)
		gradientMsg.addColorStop(0, 'rgba(124, 58, 237, 0.5)')
		gradientMsg.addColorStop(1, 'rgba(124, 58, 237, 0.0)')

		const gradientCmd = ctx.createLinearGradient(0, 0, 0, 400)
		gradientCmd.addColorStop(0, 'rgba(236, 72, 153, 0.5)')
		gradientCmd.addColorStop(1, 'rgba(236, 72, 153, 0.0)')

		activityChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: data.map(d => d.date.slice(5)),
				datasets: [
					{
						label: 'Сообщения',
						data: data.map(d => d.msg),
						borderColor: '#8b5cf6',
						backgroundColor: gradientMsg,
						borderWidth: 2,
						tension: 0.4,
						fill: true,
						pointBackgroundColor: '#1e1b2e',
					},
					{
						label: 'Команды',
						data: data.map(d => d.cmd),
						borderColor: '#ec4899',
						backgroundColor: gradientCmd,
						borderWidth: 2,
						tension: 0.4,
						fill: true,
						pointBackgroundColor: '#1e1b2e',
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { labels: { color: '#9ca3af', font: { family: 'Inter' } } },
				},
				scales: {
					x: {
						grid: { color: 'rgba(255, 255, 255, 0.05)' },
						ticks: { color: '#9ca3af' },
					},
					y: {
						grid: { color: 'rgba(255, 255, 255, 0.05)' },
						ticks: { color: '#9ca3af' },
						beginAtZero: true,
					},
				},
				interaction: { mode: 'index', intersect: false },
			},
		})
	}

	
	async function startAutoUpdates() {
		setInterval(async () => {
			try {
				const response = await fetch(AppConfig.updatesUrl)
				const result = await response.json()

				if (!result.is_synced) {
					updateStatusIndicator(false)
				} else {
					updateStatusIndicator(true)
				}

				if (result.stats) {
					if (elTotalUsers)
						elTotalUsers.innerText = result.stats.total_members || 0
					if (elOnlineUsers)
						elOnlineUsers.innerText = result.stats.online_members || 0
					if (elDailyMsg)
						elDailyMsg.innerText = result.stats.messages_today || 0
					if (elDailyCmd)
						elDailyCmd.innerText = result.stats.commands_today || 0

					if (result.stats.system) {
						const sys = result.stats.system
						if (elSysCpuVal) elSysCpuVal.innerText = sys.cpu + '%'
						if (elSysCpuBar) elSysCpuBar.style.width = sys.cpu + '%'
						if (elSysRamBar) elSysRamBar.style.width = sys.ram + '%'
						if (elSysRamVal)
							elSysRamVal.innerText = sys.ram_mb
								? sys.ram_mb + ' MB'
								: sys.ram + '%'
						if (elSysPingVal) elSysPingVal.innerText = sys.ping + ' ms'
						if (elSysPingBar) {
							let pingPercent = (sys.ping / 200) * 100
							if (pingPercent > 100) pingPercent = 100
							elSysPingBar.style.width = pingPercent + '%'
							if (sys.ping < 100) elSysPingBar.style.backgroundColor = '#10b981'
							else if (sys.ping < 300)
								elSysPingBar.style.backgroundColor = '#f59e0b'
							else elSysPingBar.style.backgroundColor = '#ef4444'
						}
					}

					if (result.stats.chart_data) {
						if (activityChart) {
							activityChart.data.datasets[0].data = result.stats.chart_data.map(
								d => d.msg,
							)
							activityChart.data.datasets[1].data = result.stats.chart_data.map(
								d => d.cmd,
							)
							activityChart.update('none')
						} else {
							initChart(result.stats.chart_data)
						}
					}

					updateActivityList(result.stats.recent_commands || [])
				}
			} catch (e) {
				updateStatusIndicator(false)
			}
		}, 2000)
	}

	

	function updateActivityList(commands) {
		if (!elActivityList) return

		if (commands.length === 0) {
			elActivityList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Нет активности за сегодня</div>`
			return
		}

		
		const today = new Date();
		const dateStr = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); 

		let html = ''
		commands.forEach(cmd => {
			const isSuccess = cmd.status !== undefined ? cmd.status : true

			
			const iconColor = isSuccess ? '#a78bfa' : '#ef4444'
			const iconBg = isSuccess
				? 'rgba(124, 58, 237, 0.15)'
				: 'rgba(239, 68, 68, 0.15)'
			const iconName = isSuccess ? 'terminal' : 'alert-circle'

			
			const cleanChannel = cmd.channel.replace('#', '')

			html += `
            <div class="activity-item compact">
                <div class="activity-icon-box" style="color: ${iconColor}; background: ${iconBg};">
                    <i data-feather="${iconName}"></i>
                </div>
                
                <div class="activity-content">
                    <div class="activity-title">
                        ${cmd.command}
                        <span class="user-badge">@${cmd.user}</span>
                    </div>
                    <div class="activity-sub">
                        <i data-feather="hash" style="width: 10px; height: 10px;"></i>
                        <span class="highlight-channel">${cleanChannel}</span>
                    </div>
                </div>

                <div class="activity-right">
                    <div class="act-time">${cmd.time}</div>
                    <div class="act-date">${dateStr}</div>
                </div>
            </div>`
			})

		elActivityList.innerHTML = html
		if (window.feather) feather.replace()
	}

	startAutoUpdates()
})
