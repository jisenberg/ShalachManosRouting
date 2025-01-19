class DeliverySystem {
  
  
  loadAPIKey(){
   const key = localStorage.getItem('apiKey')
   if (key) {
     this.apiKey = key
     document.getElementById('apiKey').value = key
   } 
  }
  
  setAPIKey(){
    this.apiKey = document.getElementById('apiKey').value
    localStorage.setItem('apiKey',this.apiKey)
  }
  
  async lookupAddressButton(){
    const router = new OpenRouter(this.apiKey)
    await router.lookup(this.lookupAddress)
    this.updateLookupFields()
  }
  
  updateLookupAddress(){
    this.lookupAddress.name = document.getElementById('lookupName').value
    this.lookupAddress.address = document.getElementById('lookupAddress').value
  }
  
  updateLookupFields(){
    document.getElementById('lookupName').value = this.lookupAddress.name ?? ''
    document.getElementById('lookupAddress').value = this.lookupAddress.address ?? ''
    document.getElementById('lookupZip').textContent = this.lookupAddress.zip
    document.getElementById('lookupLongitude').textContent = this.lookupAddress.longitude
    document.getElementById('lookupLatitude').textContent = this.lookupAddress.latitude
    let buttonStatus = this.lookupAddress.latitude == null
    document.getElementById('addAddressButton').disabled = buttonStatus
    document.getElementById('addVehicleButton').disabled = buttonStatus
  }
  
  addAddressTableRow(address){
    const table = document.getElementById('addressTable')
    const row = table.insertRow(-1)
    row.innerHTML = `
              <td>${address.name}</td>
              <td>${address.address}</td>
              <td>${address.zip}</td>
              <td>${address.longitude}</td>
              <td>${address.latitude}</td>
              <td>${address.route_index ?? ''}</td>
    `
  }
  
  updateAddressTable(addresses){
    let rows = addresses.map((address, index) => {
        return `
          <tr>
              <td>${address.name}</td>
              <td>${address.address}</td>
              <td>${address.zip}</td>
              <td>${address.longitude}</td>
              <td>${address.latitude}</td>
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
              <td>${v.time_window[0]},${v.time_window[1]}</td>
        </tr>
      `
    }).join('')
    document.getElementById('vehicleTable').innerHTML = rows
  }
  
  async route(){
    const router = new OpenRouter(this.apiKey)
    await router.route(this.addresses, this.vehicles)
    this.updateAddressTable(this.addresses)
  }
  
  addVehicleButton(){
    let myVehicles = this.vehicles
    let lookupAddress = this.lookupAddress
    let location = [lookupAddress.longitude, lookupAddress.latitude]
    myVehicles.push({
      id: myVehicles.length + 1,
      description: lookupAddress.name,
      profile: "driving-car",
      start: location,
      end: location,
      time_window: [0, 2500]
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
    this.loadAPIKey()
    document.getElementById('apiKey').addEventListener('change', (e) => {
     this.setAPIKey();
    })
    document.getElementById('lookupName').addEventListener('change', (e) => {
      this.updateLookupAddress()
    })
    document.getElementById('lookupAddress').addEventListener('change', (e) => {
      this.updateLookupAddress()
    })
    document.getElementById('addAddressButton').addEventListener('click', (e) =>{
      this.addresses.push(this.lookupAddress)
      this.addAddressTableRow(this.lookupAddress)
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
  }
} 

const deliverySystem = new DeliverySystem()