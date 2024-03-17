import { initAll } from 'govuk-frontend'
import './application.scss'
initAll()

document.addEventListener('DOMContentLoaded', (event) => {
  const sendButton = document.getElementById('sendButton')
  const sendForm = document.getElementById('sendForm')
  const loadingSpinner = document.getElementById('loadingSpinner')
  let searching = false

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
          sendForm.submit()
        }
      }
    })
  }

  if (copyButton) {
    copyButton.onclick = (event) => {
      event.preventDefault()

      const chatMessage = document.getElementById('chatMessage')

      if (chatMessage) {
        const text = chatMessage.innerText

        navigator.clipboard.writeText(text).then(
          () => {},
          () => {
            console.error('Failed to copy')
          }
        )
      }
    }
  }

  if (printButton) {
    printButton.onclick = (event) => {
      event.preventDefault()

      window.print()
    }
  }
})
