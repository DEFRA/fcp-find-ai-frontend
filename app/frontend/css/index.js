import { initAll } from 'govuk-frontend'
import './application.scss'
initAll()

document.addEventListener('DOMContentLoaded', (event) => {
  const sendButton = document.getElementById('sendButton')
  const sendForm = document.getElementById('sendForm')
  const loadingSpinner = document.getElementById('loadingSpinner')
  let searching = false

  const schemeAll = document.getElementById('schemeAll')
  const schemeCS = document.getElementById('schemeCS')
  const schemeFETF = document.getElementById('schemeFETF')
  const schemeSIG = document.getElementById('schemeSIG')
  const schemeSFI = document.getElementById('schemeSFI')

  const copyButton = document.getElementById('copyButton')
  const printButton = document.getElementById('printButton')

  if (sendButton) {
    sendButton.onclick = (event) => {
      event.preventDefault()

      if (!searching) {
        sendButton.disabled = true
        sendButton.style.display = 'none'

        if (loadingSpinner) {
          loadingSpinner.style.display = 'block'
        }

        searching = true
        trackConversationEvent && trackConversationEvent('conversation question')
        sendForm.submit()
      }
    }
  }

  const promptTextArea = document.getElementById('prompt-id')

  if (promptTextArea) {
    promptTextArea.addEventListener('keypress', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault()

        if (!searching) {
          if (sendButton) {
            sendButton.disabled = true
            sendButton.style.display = 'none'
          }

          if (loadingSpinner) {
            loadingSpinner.style.display = 'block'
          }

          searching = true
          trackConversationEvent && trackConversationEvent('conversation question')
          sendForm.submit()
        }
      }
    })
  }

  if (copyButton) {
    copyButton.onclick = (event) => {
      event.preventDefault()

      const bodyContent = document.getElementById('bodyContent')

      if (bodyContent) {
        const text = bodyContent.innerText

        navigator.clipboard.writeText(text).then(
          () => {},
          () => {
            console.error('Failed to copy')
          }
        )
      }
      trackConversationEvent && trackConversationEvent('copy')
    }
  }

  if (printButton) {
    printButton.onclick = (event) => {
      event.preventDefault()
      trackConversationEvent && trackConversationEvent('print')

      window.print()
    }
  }

  if (schemeAll) {
    schemeAll.onclick = (event) => {
      // event.preventDefault()

      if (schemeAll.checked) {
        schemeCS.checked = true
        schemeFETF.checked = true
        schemeSIG.checked = true
        schemeSFI.checked = true
      }

      trackConversationEvent && trackConversationEvent(`scheme was filtered to ${schemeAll.checked ? 'enable' : 'disable'} all`)
    }
  }

  if (schemeCS) {
    schemeCS.onclick = (event) => {
      if (!schemeCS.checked) {
        schemeAll.checked = false
      }

      trackConversationEvent && trackConversationEvent(`scheme was filtered to ${schemeCS.checked ? 'enable' : 'disable'} CS`)
    }
  }

  if (schemeFETF) {
    schemeFETF.onclick = (event) => {
      if (!schemeFETF.checked) {
        schemeAll.checked = false
      }

      trackConversationEvent && trackConversationEvent(`scheme was filtered to ${schemeFETF.checked ? 'enable' : 'disable'} FETF`)
    }
  }

  if (schemeSFI) {
    schemeSFI.onclick = (event) => {
      if (!schemeSFI.checked) {
        schemeAll.checked = false
      }

      trackConversationEvent && trackConversationEvent(`scheme was filtered to ${schemeSFI.checked ? 'enable' : 'disable'} SFI`)
    }
  }

  if (schemeSIG) {
    schemeSIG.onclick = (event) => {
      if (!schemeSIG.checked) {
        schemeAll.checked = false
      }
    }

    trackConversationEvent && trackConversationEvent(`scheme was filtered to ${schemeSIG.checked ? 'enable' : 'disable'} SIG`)
  }

  // find form with the action including /reset string
  const resetForm = document.querySelector('form[action*="/reset"]')

  // if it exists, track the onsubmit event with the trackConversationEvent function
  if (resetForm) {
    resetForm.onsubmit = () => {
      trackConversationEvent && trackConversationEvent('new conversation')
    }
  }
})
