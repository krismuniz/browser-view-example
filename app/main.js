const { app, BrowserWindow, BrowserView, Menu, ipcMain } = require('electron')
const path = require('path')

function createBrowser () {
  const browser = new BrowserWindow({
    title: 'Browser',
    width: 1024,
    height: 768,
    minWidth: 480,
    minHeight: 272,
    backgroundColor: '#FFFFFF',
    center: true,
    titleBarStyle: 'hiddenInset'
  })

  const menu = new BrowserWindow({
    title: 'Blue',
    width: 256,
    height: 300,
    parent: browser,
    backgroundColor: '#FFFFFF',
    frame: false,
    resizable: false,
    maximizable: false,
    show: false,
    fullscreenable: false,
    fullscreen: false
  })

  menu.loadURL('file://' + path.join(__dirname, 'menu.html'))
  menu.on('ready-to-show', async () => {
    const contentBounds = await menu.webContents.executeJavaScript('document.body.getBoundingClientRect().toJSON()')
    menu.setSize(contentBounds.width, contentBounds.height + 16) // the + 16 is because getBoundingClientRect doesn't respect margins
  })
  menu.on('blur', () => menu.hide())

  const frame = new BrowserView({
    backgroundColor: '#F8F8F8',
    webPreferences: {
      nodeIntegration: false,
      scrollBounce: true
    }
  })

  browser.loadURL('file://' + path.join(__dirname, 'browser.html'))
  browser.setBrowserView(frame)

  ipcMain.on('browser-menu', () => {
    const browserBounds = browser.getBounds()
    const menuBounds = menu.getBounds()

    menu.setPosition(browserBounds.x + browserBounds.width - menuBounds.width - 6, browserBounds.y + 74)
  
    menu.show()
    menu.focus()
  })

  frame.setBounds({ x: 0, y: 74, width: 1024, height: 694 })
  frame.setAutoResize({ width: true, height: true })
  frame.webContents.loadURL('https://electronjs.org')

  frame.webContents.on('context-menu', (event, props) => {
    const { editFlags } = props
		const hasText = props.selectionText.trim().length > 0
    const can = type => editFlags[`can${type}`] && hasText
    
    const items = [
      {
        id: 'back',
        label: 'Back',
        enabled: frame.webContents.canGoBack(),
        click () {
          frame.webContents.goBack()
        }
      },
      {
        id: 'forward',
        label: 'Forward',
        enabled: frame.webContents.canGoForward(),
        click () {
          frame.webContents.goForward()
        }
      },
      {
        id: 'reload',
        label: 'Reload',
        click () {
          frame.webContents.reload()
        }
      },
      { type: 'separator' },
      {
        id: 'undo',
        label: 'Undo',
        role: can('Undo') ? 'undo' : '',
        enabled: can('Undo'),
        visible: props.isEditable
      },
      {
        id: 'redo',
        label: 'Redo',
        role: can('Redo') ? 'redo' : '',
        enabled: can('Redo'),
        visible: props.isEditable
      },
      { type: 'separator' },
      {
        id: 'cut',
        label: 'Cut',
        role: can('Cut') ? 'cut' : '',
        enabled: can('Cut'),
        visible: props.isEditable
      },
      {
        id: 'copy',
        label: 'Copy',
        role: can('Copy') ? 'copy' : '',
        enabled: can('Copy'),
        visible: props.isEditable || hasText
      },
      {
        id: 'paste',
        label: 'Paste',
        role: editFlags.canPaste ? 'paste' : '',
        enabled: editFlags.canPaste,
        visible: props.isEditable
      },
      { type: 'separator' },
      {
				id: 'inspect',
				label: 'Inspect Element',
				click () {
					frame.webContents.inspectElement(props.x, props.y)

					if (frame.webContents.isDevToolsOpened()) {
						frame.webContents.devToolsWebContents.focus()
					}
				}
			}
    ]

    const menu = Menu.buildFromTemplate(items)
    menu.popup(browser.getBrowserView())
  })

  return browser
}

app.setName('BV Browser')
app.on('ready', () => {
  createBrowser()
})
