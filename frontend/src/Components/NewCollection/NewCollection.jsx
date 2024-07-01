import React, { useEffect, useState } from 'react'
import './NewCollection.css'
import Item from '../Item/Item'
// import new_collection from '../Assets/new_collections'

const NewCollection = () => {

  const [new_collection,setNew_collection] = useState([]);

  useEffect(()=>{
    fetch('/newcollections')
    .then((response)=>response.json())
    .then((data)=>setNew_collection(data))
  },[])

  return (
    <div className="new-collection">
        <h1>NEW COLLECTION</h1>
        <hr />
        <div className="margin">
        <div className="collection">
            {new_collection.map((item,i)=>{
                return <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price}/>
            })}
        </div>
        </div>
    </div>
  )
}

export default NewCollection
