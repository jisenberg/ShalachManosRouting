class DeliverySystem {
  
  
  loadSettings(){
   const key = localStorage.getItem('apiKey')
   if (key) {
     this.apiKey = key
     document.getElementById('apiKey').value = key
   }
   const boundary = localStorage.getItem('boundary')
   if (boundary){
     this.boundary = boundary
     document.getElementById('boundary').value = boundary
   }
  }
  
  saveSettings(){
    this.apiKey = document.getElementById('apiKey').value
    localStorage.setItem('apiKey',this.apiKey)
    this.boundary = document.getElementById('boundary').value
    localStorage.setItem('boundary',this.boundary)
  }
  
  async lookupAddressButton(){
    const router = new OpenRouter(this.apiKey, this.boundary)
    await router.lookup(this.lookupAddress)
    this.updateLookupFields()
  }
  
  updateLookupAddress(){
    this.lookupAddress.name = document.getElementById('lookupName').value
    this.lookupAddress.address = document.getElementById('lookupAddress').value
    this.lookupAddress.start = document.getElementById('lookupStart').value
    this.lookupAddress.end = document.getElementById('lookupEnd').value
    document.getElementById('addVehicleButton').disabled = this.lookupAddress.latitude == null || this.lookupAddress.start == '' || this.lookupAddress.end == ''
  }
  
  updateLookupFields(){
    document.getElementById('lookupName').value = this.lookupAddress.name ?? ''
    document.getElementById('lookupAddress').value = this.lookupAddress.address ?? ''
    document.getElementById('lookupZip').textContent = this.lookupAddress.zip
    document.getElementById('lookupLongitude').textContent = this.lookupAddress.longitude
    document.getElementById('lookupLatitude').textContent = this.lookupAddress.latitude
    document.getElementById('lookupStart').value = this.lookupAddress.start ?? ''
    document.getElementById('lookupEnd').value = this.lookupAddress.end ?? ''
    
    document.getElementById('addAddressButton').disabled = this.lookupAddress.latitude == null
    document.getElementById('addVehicleButton').disabled = this.lookupAddress.latitude == null || this.lookupAddress.start == '' || this.lookupAddress.end == ''
  }
  
  updateAddressTable(addresses){
    let rows = addresses.map((address, index) => {
        let timeWindow = (address.start != '' && address.end != '')  ? (address.start + ' - ' + address.end) : ''
        return `
          <tr>
              <td>${address.name}</td>
              <td>${address.address}</td>
              <td>${address.zip}</td>
              <td>${address.longitude}</td>
              <td>${address.latitude}</td>
              <td>${timeWindow}</td>
              <td>${address.route_index ?? ''}</td
          </tr>
        `
    }).join('')
    document.getElementById('addressTable').innerHTML = rows
  }
  
  
  updateVehicleTable(vehicles){
    let rows = vehicles.map((v, index) => {
      return `
        <tr>
              <td>${v.id}</td>              
              <td>${v.description}</td>   
              <td>${v.profile}</td>
              <td>${v.start[0]},${v.start[1]}</td>
              <td>${v.end[0]},${v.end[1]}</td>
              <td>${v.time_window[0]} - ${v.time_window[1]}</td>
        </tr>
      `
    }).join('')
    document.getElementById('vehicleTable').innerHTML = rows
  }
  
  async route(){
    const router = new OpenRouter(this.apiKey,this.boundary)
    await router.route(this.addresses, this.vehicles)
    this.updateAddressTable(this.addresses)
  }
  
  addVehicleButton(){
    let myVehicles = this.vehicles
    let lookupAddress = this.lookupAddress
    let location = [lookupAddress.longitude, lookupAddress.latitude]
    let timeWindow = [lookupAddress.start,lookupAddress.end]
    myVehicles.push({
      id: myVehicles.length + 1,
      description: lookupAddress.name,
      profile: "driving-car",
      start: location,
      end: location,
      time_window: timeWindow
    })
    this.updateVehicleTable(myVehicles)
    this.lookupAddress = {}
    this.updateLookupFields()
  }
  
  constructor() {
    this.lookupAddress = {}
    this.addresses = []
    this.vehicles = []
    let savedState = localStorage.getItem('savedState')
    if (savedState){
      let {vehicles, addresses} = JSON.parse(savedState)
      this.vehicles = vehicles 
      this.addresses = addresses 
      this.updateAddressTable(addresses)
      this.updateVehicleTable(vehicles)
    }
    this.loadSettings()
    document.getElementById('apiKey').addEventListener('change', (e) => {
      this.saveSettings();
    })
    document.getElementById('boundary').addEventListener('change', (e) => {
      this.saveSettings();
    })
    const lookupFieldIds = [
      'lookupName','lookupAddress',
      'lookupStart','lookupEnd'
    ]
    lookupFieldIds.map((fieldid) => {
      document.getElementById(fieldid).addEventListener('change', (e) => {
        this.updateLookupAddress()
      })
    })

    document.getElementById('addAddressButton').addEventListener('click', (e) =>{
      this.addresses.push(this.lookupAddress)
      this.updateAddressTable(this.addresses)
      this.lookupAddress = {}
      this.updateLookupFields()
    })
    document.getElementById('addVehicleButton').addEventListener('click', (e) => {
        this.addVehicleButton()
    })
    document.getElementById('routeButton').addEventListener('click', async (e) => {
      this.route()
    })
    document.getElementById('lookupButton').addEventListener('click',async (e) => {
      await this.lookupAddressButton()
    })
    document.getElementById('saveButton').addEventListener('click',(e) => {
        localStorage.setItem('savedState',JSON.stringify({
          vehicles: this.vehicles,
          addresses: this.addresses
        }))
    })
    document.getElementById('clearAddresses').addEventListener('click',(e) => {
        this.addresses = []
        this.updateAddressTable(this.addresses)
    })
    document.getElementById('clearVehicles').addEventListener('click',(e) => {
        this.vehicles = []
        this.updateVehicleTable(this.vehicles)
    })
  }
} 

const deliverySystem = new DeliverySystem()