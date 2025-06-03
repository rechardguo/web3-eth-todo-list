App = {
  loading: false,
  local: true, 
  contracts: {},

  load: async () => {
    await App.loadWeb3()   
    await App.loadContract()
    await App.render()
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {
    if (!App.local && window.ethereum) {
      console.log('MetaMask is installed!');
      // 请求用户授权
      let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      window.web3 = new Web3(window.ethereum);
      console.log('Connected with account:', accounts[0]);
      App.account = accounts[0];
    } else {
      // 连接本地 Ganache
      App.web3Provider = new Web3.providers.HttpProvider("https://symmetrical-lamp-xxv6655rp526xjq-7545.app.github.dev/")
      web3 = new Web3(App.web3Provider)
      // after run `ganache-cli`  you can find the account address in the terminal 
      App.account = '0x1D9B9426393A175E70775d67AAf4E4520ec10Dd0' // Replace with your Ganache account address
      console.log('Connected to local Ganache');
    }
  },

 

  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const todoList = await $.getJSON('TodoList.json')
    App.contracts.TodoList = TruffleContract(todoList)
    App.contracts.TodoList.setProvider(window.web3.currentProvider)

    // Hydrate the smart contract with values from the blockchain
    App.todoList = await App.contracts.TodoList.deployed()   
  },

  render: async () => {
    // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(true)

    // Render Account
    $('#account').html(App.account)

    // Render Tasks
    await App.renderTasks()

    // Update loading state
    App.setLoading(false)
  },

  renderTasks: async () => {
    // Load the total task count from the blockchain
    const taskCount = await App.todoList.taskCount()
    const $taskTemplate = $('.taskTemplate')

    // Render out each task with a new task template
    for (var i = 1; i <= taskCount; i++) {
      // Fetch the task data from the blockchain
      const task = await App.todoList.tasks(i)
      const taskId = task[0].toNumber()
      const taskContent = task[1]
      const taskCompleted = task[2]

      // Create the html for the task
      const $newTaskTemplate = $taskTemplate.clone()
      $newTaskTemplate.find('.content').html(taskContent)
      $newTaskTemplate.find('input')
                      .prop('name', taskId)
                      .prop('checked', taskCompleted)
                      .on('click', App.toggleCompleted)

      // Put the task in the correct list
      if (taskCompleted) {
        $('#completedTaskList').append($newTaskTemplate)
      } else {
        $('#taskList').append($newTaskTemplate)
      }

      // Show the task
      $newTaskTemplate.show()
    }
  },

  createTask: async () => {
    App.setLoading(true)
    const content = $('#newTask').val()
    await App.todoList.createTask(content, { from: App.account })
    window.location.reload()
  },

  toggleCompleted: async (e) => {
    App.setLoading(true)
    const taskId = e.target.name
    await App.todoList.toggleCompleted(taskId, { from: App.account })
    window.location.reload()
  },

  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}

$(() => {
  $(window).load(() => {
    App.load()
  })
})
