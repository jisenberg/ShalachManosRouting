'use client'
import { useState, useEffect } from "react";
import Openrouteservice from "openrouteservice-js";

type Address = {
  name: string;
  address: string;
  zip: number;
  longitude: number;
  lattitude: number;
  route_index: string | undefined;
}

function getAPIKey() {
  var key = localStorage.getItem("apiKey");
  if (key == null) {
    key = "";
  }
  return key;
}

async function geocode(searchText: string) {
  let geocode = new Openrouteservice.Geocode({ api_key: getAPIKey() });
  let response = await geocode.geocode({
    text: searchText,
  });

  return response.features;
}

async function optimize(addresses: Address[], vehicles) {
  let Optimization = new Openrouteservice.Optimization({ api_key: getAPIKey() });

  try {
    const request = {
      jobs: addresses.map((address, i) => {
        return { id: i + 1, description: address.name, location: [address.longitude, address.lattitude], service: 300 };
      }),
      vehicles: vehicles.map(v => {
        return {id: v.id, profile: v.profile, start: v.start, end: v.end, time_window: v.time_window}
      }),
    };
    console.log(request);
    let response = await Optimization.optimize(request)
    console.log(response);
    for (var idx in response.routes) {
      var route = response.routes[idx];
      route.steps.forEach((step: any, index: number) => {
        if (step.type == "job") {
          addresses[step.id - 1].route_index = route.vehicle + "-" + (index);
        }
      });
    }

  } catch (err: any) {
    console.log("An error occurred: " + err.status)
    console.error(await err.response.json())
  }
}

const readJsonFile = (file: Blob) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader()

    fileReader.onload = event => {
      if (event.target) {
        resolve(JSON.parse(event.target.result as string))
      }
    }

    fileReader.onerror = error => reject(error)
    fileReader.readAsText(file)
  })

export default function Home() {
  const [apiKeyField, setApiKeyField] = useState('');


  useEffect(() => {
    const savedValue = localStorage.getItem("apiKey");
    setApiKeyField(savedValue ?? "");
  }, []);
  
  useEffect(() => {
    localStorage.setItem("apiKey", apiKeyField);
  }, [apiKeyField]);
  
  const [lookupAddress, setLookupAddress] = useState({});
  const [addresses, setAddresses] = useState({ list: [] });
  const [vehicles, setVehicles] = useState([])

  const lookupButtonClick = async () => {
    let myAddress: Address = { ...lookupAddress };
    let gc = await geocode(myAddress.address);
    myAddress.address = gc[0].properties.name;
    myAddress.zip = gc[0].properties.postalcode;
    myAddress.longitude = gc[0].geometry.coordinates[0];
    myAddress.lattitude = gc[0].geometry.coordinates[1];
    setLookupAddress(myAddress);
  }

  const addStopClick = (e: Event) => {
    let list: Address[] = [...addresses.list];
    list.push({ ...lookupAddress });
    setAddresses({ list: list });
    setLookupAddress({});
  }

  const addVehcileClick = (e: Event) => {
    let myVehicles = [ ...vehicles]
    let location = [lookupAddress.longitude, lookupAddress.lattitude]
    myVehicles.push({
      id: myVehicles.length + 1,
      description: lookupAddress.name,
      profile: "driving-car",
      start: location,
      end: location,
      time_window: [0,2500]
    })
    setVehicles(myVehicles)
    setLookupAddress({})
  }

  const updateLookupAddress = (e: Event, a: string) => {
    let myAddress: Address = { ...lookupAddress };
    myAddress[a] = e.target.value;
    setLookupAddress(myAddress)
  }

  const routeClick = async () => {
    let list = [...addresses.list];
    await optimize(list, vehicles);
    setAddresses({ list: list });
  }

  return (
    <>
      <div >
        <label>
          API Key: <input value={apiKeyField} onChange={e => {
            const value = e.target.value;
            setApiKeyField(value);
          }} />
        </label>
        <br />
      </div>
      <table border="1">
        <thead>
          <tr>
            <th>Row</th>
            <th>Name</th>
            <th>Address</th>
            <th>Zip</th>
            <th>Longitude</th>
            <th>Lattitude</th>
            <th>Route Index</th>
          </tr>
        </thead>
        <tbody>
          {addresses.list.map((address: Address, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{address.name}</td>
              <td>{address.address}</td>
              <td>{address.zip}</td>
              <td>{address.longitude}</td>
              <td>{address.lattitude}</td>
              <td>{address.route_index}</td>
            </tr>
          ))}
          <tr>
            <td><button onClick={lookupButtonClick} >Lookup</button></td>
            <td><input value={lookupAddress.name ?? ''} onChange={e => { updateLookupAddress(e, 'name') }} /></td>
            <td><input value={lookupAddress.address ?? ''} onChange={e => { updateLookupAddress(e, 'address') }} /></td>
            <td>{lookupAddress.zip ?? ''}</td>
            <td>{lookupAddress.longitude ?? ''}</td>
            <td>{lookupAddress.lattitude ?? ''}</td>
          </tr>
        </tbody>
      </table>

      <button onClick={addStopClick}>Add Stop</button>
      <button onClick={addVehcileClick}>Add Vehicle</button><br/>
      <button onClick={routeClick}>Route</button><br />
      <button onClick={e => {
        exportAddressTable(addresses.list);
      }}>Export</button><br />
      <FileInput setList={l => {
        console.log(l);
        setAddresses({ list: l })
      }}></FileInput>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Profile</th>
            <th>Start</th>
            <th>End</th>
            <th>Time Window</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, index) => (
            <tr key={index}>
              <td>{v.id}</td>              
              <td>{v.description}</td>              
              <td>{v.profile}</td>
              <td>{v.start[0]},{v.start[1]}</td>
              <td>{v.end[0]},{v.end[1]}</td>
              <td>{v.time_window[0]},{v.time_window[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </>
  )
}

function exportAddressTable(addresses) {
  const fileData = JSON.stringify(addresses);
  const blob = new Blob([fileData], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "addresses.json";
  link.href = url;
  link.click();
}

const FileInput = ({ setList }) => {
  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const parsedData = await readJsonFile(event.target.files[0])
      setList(parsedData)
    }
  }

  return (
    <input type="file" accept=".json,application/json" onChange={onChange} />
  )
}
