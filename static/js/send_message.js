document.addEventListener('DOMContentLoaded', () => {
	let currentVersion = 'v1'
	const btnSwitchV1 = document.getElementById('btnSwitchV1')
	const btnSwitchV2 = document.getElementById('btnSwitchV2')
	const builderV1 = document.getElementById('builder-v1')
	const builderV2 = document.getElementById('builder-v2')
	const previewV1 = document.getElementById('preview-v1')
	const previewV2 = document.getElementById('preview-v2')
	const editorTitle = document.getElementById('editorTitle')

	function updateButtonInputsVisibility() {
		const sectionInputs = document.querySelectorAll('.btn-section-wrapper')
		sectionInputs.forEach(el => {
			if (currentVersion === 'v1') el.style.display = 'none'
			else el.style.display = 'block'
		})
	}

	if (btnSwitchV1 && btnSwitchV2) {
		function switchVersion(ver) {
			currentVersion = ver
			if (ver === 'v1') {
				btnSwitchV1.classList.add('active')
				btnSwitchV2.classList.remove('active')
				builderV1.style.display = 'block'
				builderV2.style.display = 'none'
				previewV1.style.display = 'block'
				previewV2.style.display = 'none'
				editorTitle.textContent = 'Редактор V1'
			} else {
				btnSwitchV2.classList.add('active')
				btnSwitchV1.classList.remove('active')
				builderV1.style.display = 'none'
				builderV2.style.display = 'block'
				previewV1.style.display = 'none'
				previewV2.style.display = 'block'
				editorTitle.textContent = 'Редактор V2 (Components)'
			}
			updateButtonInputsVisibility()
			renderAll()
		}
		btnSwitchV1.addEventListener('click', () => switchVersion('v1'))
		btnSwitchV2.addEventListener('click', () => switchVersion('v2'))
	}

	const channelSelect = document.getElementById('channelSelect')
	const btnSend = document.getElementById('btnSendEmbed')
	const btnClear = document.getElementById('btnClear')
	const statusDiv = document.getElementById('statusMessage')

	const inpTitle = document.getElementById('embedTitle')
	const inpDesc = document.getElementById('embedDesc')
	const inpColor = document.getElementById('embedColor')
	const inpImage = document.getElementById('embedImage')
	const inpThumb = document.getElementById('embedThumbnail')
	const v2Content = document.getElementById('v2Content')
	const v2Image = document.getElementById('v2Image')
	const v2ImageDesc = document.getElementById('v2ImageDesc')
	const v2FileUrl = document.getElementById('v2FileUrl')
	const v2FileName = document.getElementById('v2FileName')

	const prevV2Content = document.getElementById('prevV2Content')
	const prevV2ImageBox = document.getElementById('prevV2ImageBox')
	const prevV2Image = document.getElementById('prevV2Image')
	const prevV2Hint = document.getElementById('prevV2Hint')
	const prevV2Buttons = document.getElementById('prevV2Buttons')
	const prevV2FileBox = document.getElementById('prevV2FileBox')
	const prevV2FileName = document.getElementById('prevV2FileName')
	const prevTitle = document.getElementById('prevTitle')
	const prevDesc = document.getElementById('prevDesc')
	const prevColorBar = document.getElementById('prevColorBar')
	const prevFields = document.getElementById('prevFields')
	const prevImageBox = document.getElementById('prevImageBox')
	const prevImage = document.getElementById('prevImage')
	const prevThumb = document.getElementById('prevThumb')

	const fieldsContainer = document.getElementById('fieldsContainer')
	const buttonsContainer = document.getElementById('buttonsContainer')
	const btnAddField = document.getElementById('btnAddField')
	const btnAddButton = document.getElementById('btnAddButton')

	let currentChannelsHash = ''

	function renderAll() {
		
		if (prevTitle) {
			prevColorBar.style.backgroundColor = inpColor.value
			if (inpTitle.value) {
				prevTitle.textContent = inpTitle.value
				prevTitle.style.display = 'block'
			} else {
				prevTitle.style.display = 'none'
			}

			if (inpDesc.value) {
				prevDesc.textContent = inpDesc.value
				prevDesc.style.display = 'block'
			} else {
				prevDesc.style.display = 'none'
			}

			if (inpImage.value) {
				prevImage.src = inpImage.value
				prevImageBox.style.display = 'block'
			} else {
				prevImageBox.style.display = 'none'
			}

			if (inpThumb.value) {
				prevThumb.src = inpThumb.value
				prevThumb.style.display = 'block'
			} else {
				prevThumb.style.display = 'none'
			}

			prevFields.innerHTML = ''
			document.querySelectorAll('.field-row:not(.button-row)').forEach(row => {
				const name = row.querySelector('.field-name').value
				const value = row.querySelector('.field-value').value
				const isInline = row.querySelector('.field-inline').checked
				if (name || value) {
					const d = document.createElement('div')
					d.className = `d-embed-field ${isInline ? 'inline' : ''}`
					d.innerHTML = `<div class="d-field-name">${name}</div><div class="d-field-value">${value}</div>`
					prevFields.appendChild(d)
				}
			})

			const prevButtonsV1 = document.getElementById('prevButtons')
			if (prevButtonsV1) prevButtonsV1.innerHTML = ''
			if (currentVersion === 'v1' && prevButtonsV1) {
				document.querySelectorAll('.button-row').forEach(row => {
					const label = row.querySelector('.btn-label').value
					if (label) {
						const b = document.createElement('div')
						b.className = 'd-btn'
						b.textContent = label
						prevButtonsV1.appendChild(b)
					}
				})
			}
		}

		
		if (prevV2Content) {
			const rawText = v2Content.value || '# Заголовок\nТекст...'
			prevV2Content.innerHTML =
				typeof marked !== 'undefined'
					? marked.parse(rawText)
					: rawText.replace(/\n/g, '<br>')

			if (v2Image.value) {
				prevV2ImageBox.style.display = 'block'
				prevV2Image.src = v2Image.value
				if (v2ImageDesc.value) {
					prevV2Hint.style.display = 'block'
					prevV2Hint.textContent = v2ImageDesc.value
				} else {
					prevV2Hint.style.display = 'none'
				}
			} else {
				prevV2ImageBox.style.display = 'none'
			}

			if (v2FileUrl.value || v2FileName.value) {
				prevV2FileBox.style.display = 'flex'
				prevV2FileName.textContent = v2FileName.value || 'document.pdf'
			} else {
				prevV2FileBox.style.display = 'none'
			}

			prevV2Buttons.innerHTML = ''
			if (currentVersion === 'v2') {
				document.querySelectorAll('.button-row').forEach(row => {
					const label = row.querySelector('.btn-label').value
					const sectionText = row.querySelector('.btn-section-text').value

					if (label) {
						const displayText = sectionText || label + ':'
						const sectionHtml = `
                            <div class="v2-section-row">
                                <div class="v2-section-label">${displayText}</div>
                                <div class="d-btn small" style="background: #4f545c;">${label} 🔗</div>
                            </div>
                        `
						prevV2Buttons.insertAdjacentHTML('beforeend', sectionHtml)
					}
				})
			}
		}
	}

	const inputs = [
		inpTitle,
		inpDesc,
		inpColor,
		inpImage,
		inpThumb,
		v2Content,
		v2Image,
		v2ImageDesc,
		v2FileUrl,
		v2FileName,
	]
	inputs.forEach(el => {
		if (el) el.addEventListener('input', renderAll)
	})

	if (btnAddButton) {
		btnAddButton.addEventListener('click', () => {
			const btnId = Date.now()
			const sectionStyle =
				currentVersion === 'v1' ? 'display:none;' : 'display:block;'
			const btnHTML = `
                <div class="field-row button-row" id="btn-${btnId}">
                    <div class="field-header">
                        <span class="inline-toggle" style="cursor: default;">Настройка кнопки</span>
                        <button class="remove-btn" data-target="btn-${btnId}"><i data-feather="trash-2" style="width:14px;"></i></button>
                    </div>
                    <div class="field-inputs" style="grid-template-columns: 1fr 1fr 1fr;">
                        <div class="btn-section-wrapper" style="${sectionStyle}">
                            <input type="text" class="btn-section-text" placeholder="Текст слева (V2)">
                        </div>
                        <input type="text" class="btn-label" placeholder="Текст на кнопке">
                        <input type="text" class="btn-url" placeholder="URL ссылки">
                    </div>
                </div>
            `
			buttonsContainer.insertAdjacentHTML('beforeend', btnHTML)
			feather.replace()
			const newRow = document.getElementById(`btn-${btnId}`)
			newRow
				.querySelectorAll('input')
				.forEach(i => i.addEventListener('input', renderAll))
			newRow
				.querySelector('.remove-btn')
				.addEventListener('click', function () {
					document.getElementById(this.dataset.target).remove()
					renderAll()
				})
			renderAll()
		})
	}

	if (btnAddField) {
		btnAddField.addEventListener('click', () => {
			const fieldId = Date.now()
			const fieldHTML = `
                <div class="field-row" id="field-${fieldId}">
                    <div class="field-header">
                        <label class="inline-toggle"><input type="checkbox" class="field-inline"> Inline (В строку)</label>
                        <button class="remove-btn" data-target="field-${fieldId}"><i data-feather="trash-2" style="width:14px;"></i></button>
                    </div>
                    <div class="field-inputs">
                        <input type="text" class="field-name" placeholder="Name">
                        <input type="text" class="field-value" placeholder="Value">
                    </div>
                </div>
            `
			fieldsContainer.insertAdjacentHTML('beforeend', fieldHTML)
			feather.replace()
			const newRow = document.getElementById(`field-${fieldId}`)
			newRow
				.querySelectorAll('input')
				.forEach(i => i.addEventListener('input', renderAll))
			newRow
				.querySelector('.remove-btn')
				.addEventListener('click', function () {
					document.getElementById(this.dataset.target).remove()
					renderAll()
				})
			renderAll()
		})
	}

	if (btnClear) {
		btnClear.addEventListener('click', () => {
			if (inpTitle) inpTitle.value = ''
			if (inpDesc) inpDesc.value = ''
			if (inpColor) inpColor.value = '#7c3aed'
			if (inpImage) inpImage.value = '' 
			if (inpThumb) inpThumb.value = '' 

			if (fieldsContainer) fieldsContainer.innerHTML = ''

			if (v2Content) v2Content.value = ''
			if (v2Image) v2Image.value = ''
			if (v2ImageDesc) v2ImageDesc.value = ''
			if (v2FileUrl) v2FileUrl.value = ''
			if (v2FileName) v2FileName.value = ''

			
			if (buttonsContainer) buttonsContainer.innerHTML = ''

			
			renderAll()
		})
	}

	if (btnSend) {
		btnSend.addEventListener('click', async () => {
			statusDiv.innerHTML = ''
			const channelId = channelSelect.value
			if (!channelId) {
				statusDiv.innerHTML =
					'<span style="color:#f87171;">⚠️ Выберите канал!</span>'
				return
			}

			const authorId = document.getElementById('authorId').value

			const buttonsData = []
			document.querySelectorAll('.button-row').forEach(row => {
				const label = row.querySelector('.btn-label').value
				const url = row.querySelector('.btn-url').value
				const sectionText = row.querySelector('.btn-section-text').value
				if (label && url) {
					buttonsData.push({
						label: label,
						url: url,
						section_text: sectionText,
					})
				}
			})

			let payload = {}
			if (currentVersion === 'v1') {
				const fieldsData = []
				document
					.querySelectorAll('.field-row:not(.button-row)')
					.forEach(row => {
						const name = row.querySelector('.field-name').value
						const value = row.querySelector('.field-value').value
						const inline = row.querySelector('.field-inline').checked
						if (name && value) fieldsData.push({ name, value, inline })
					})
				payload = {
					type: 'v1',
					channel_id: channelId,
					author_id: authorId,
					title: inpTitle.value,
					description: inpDesc.value,
					color: inpColor.value,
					image_url: inpImage.value,
					thumbnail_url: inpThumb.value,
					fields: fieldsData,
					buttons: buttonsData,
				}
			} else {
				payload = {
					type: 'v2',
					channel_id: channelId,
					author_id: authorId,
					content: v2Content.value,
					image_url: v2Image.value,
					image_desc: v2ImageDesc.value,
					file_url: v2FileUrl.value,
					file_name: v2FileName.value,
					buttons: buttonsData,
				}
			}

			btnSend.disabled = true
			btnSend.innerHTML = 'Отправка...'

			try {
				const response = await fetch(AppConfig.apiUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'send_embed', data: payload }),
				})
				if (response.ok)
					statusDiv.innerHTML = '<span style="color:#10b981;">✔ Успешно!</span>'
				else
					statusDiv.innerHTML = '<span style="color:#f87171;">❌ Ошибка</span>'
			} catch (e) {
				statusDiv.innerHTML =
					'<span style="color:#f87171;">❌ Ошибка сети</span>'
			}
			setTimeout(() => {
				btnSend.disabled = false
				btnSend.innerHTML = 'Отправить'
				feather.replace()
			}, 1500)
		})
	}

	
	async function startAutoUpdates() {
		setInterval(async () => {
			try {
				const response = await fetch(AppConfig.updatesUrl)
				const result = await response.json()

				
				updateStatusIndicator(result.is_synced)

				const newChString = JSON.stringify(result.channels)
				if (newChString !== currentChannelsHash) {
					const currentVal = channelSelect.value
					channelSelect.innerHTML =
						'<option value="" disabled>Выберите канал...</option>'
					if (result.channels) {
						result.channels.forEach(item => {
							const opt = document.createElement('option')
							opt.value = item.id
							opt.textContent = item.name
							channelSelect.appendChild(opt)
						})
					}
					channelSelect.value = currentVal
					currentChannelsHash = newChString
				}
			} catch (e) {
				updateStatusIndicator(false)
			}
		}, 2000)
	}
	startAutoUpdates()
	renderAll()
})
