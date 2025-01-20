class OpenRouter {
  constructor(apikey,boundary){
    this.apikey=apikey
    this.baseurl='https://api.openrouteservice.org'
    this.boundary = boundary
  }
  
  timeToSeconds(timeInput) {
    const [hours, minutes] = timeInput.split(":").map(Number);
    return hours * 3600 + minutes * 60;
  }
  
  async lookup(address){
    let params = {
      api_key: this.apikey,
      text: address.address
    }
    let boundary = this.boundary
    console.log(boundary)
    if (boundary && boundary != ''){
      params['boundary.gid'] = boundary
    }
    const url = this.baseurl + '/geocode/search?' + new URLSearchParams(params).toString()
    let response = await fetch(url)
    let json = await response.json()
    if (json.features[0]){
      const gc = json.features[0]
      address.address = gc.properties.name;
      address.zip = gc.properties.postalcode;
      address.longitude = gc.geometry.coordinates[0];
      address.latitude = gc.geometry.coordinates[1];
    }
  }
    
  async route(addresses,vehicles){
      const jobs = {
        jobs: addresses.map((address, i) => {
          const job = { id: i + 1, description: address.name, location: [address.longitude, address.latitude], service: 300 };
          if (address.start != '' && address.end != ''){
            job.time_windows = [[
              this.timeToSeconds(address.start),
              this.timeToSeconds(address.end)]]
          }
          return job
        }),
        vehicles: vehicles.map(v => {
          return { 
            id: v.id, 
            profile: v.profile, 
            start: v.start, 
            end: v.end, 
            time_window: v.time_window.map(this.timeToSeconds) 
          }
        }),
      }
      console.log(jobs)
      const headers ={
        Accept:'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Content-Type': 'application/json',
        'Authorization': this.apikey
      }
      const url = this.baseurl + '/optimization'
      const request = new Request(url,{
        headers: headers,
        method: 'POST',
        body: JSON.stringify(jobs)
      })
      const response = await fetch(request)
      const routing = await response.json()
      console.log(routing)
      for (let idx in routing.routes) {
        let route = routing.routes[idx];
        route.steps.forEach((step, index) => {
          if (step.type == "job") {
            addresses[step.id - 1].route_index = route.vehicle + "-" + (index);
          }
        });
      }
      console.log(addresses)
  }
  
  
}