import React from 'react'

import {useState, useEffect} from 'react'

export const UseFetch = (url) => {
    let [listReceitas, setListReceitas] = useState([])

    let [listDespesas, setListDespesas] = useState([])

    let [idDelete, setIdDelete] = useState(null)

    let [idUpdate, setIdUpdate] = useState(null)

    let [config, setConfig] = useState(null)

    let [callFetchData, setCallFetchData] = useState(false)

    

    

    

    const httpConfig = (data, method) =>{
        
        if(method === "POST"){
            setConfig({
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
        }
        if(method === "DELETE"){
            setIdDelete(data.id)
            setConfig({
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json"
                },
            });
        }
        if(method === "PATCH"){
            setIdUpdate(data.id)
            setConfig({
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
        }
    };

    useEffect(() => {
        
        const fetchData = async () => {
            try {
                const response = await fetch(url);
                const json = await response.json();
                setListReceitas(json);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [url, callFetchData]);

    useEffect(() => {
        
        const fetchData = async () => {
            try {
                const response = await fetch(url);
                const json = await response.json();
                setListDespesas(json);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [url, callFetchData]);

    useEffect(() => {
        if (!config) return;
        const httpRequest = async () => {
            if(config.method === "POST"){
                try{
                    const response = await fetch(url, config);            
                    const json = await response.json();
                    setCallFetchData(json);
                }catch(error){
                    console.error('Erro ao enviar dados:', error);
                }
            }
            if(config.method === "DELETE"){
                try {
                    const response = await fetch(`${url}/${idDelete}`, config);
                    const json = await response.json();
                    setCallFetchData(json);
                } catch(error) {
                    console.error('Erro ao deletar:', error);
                }
            }
            if(config.method === "PATCH"){
                try {
                    
                    const response = await fetch(`${url}/${idUpdate}`, config);
                    const json = await response.json();
                    setCallFetchData(json);
                } catch(error) {
                    console.error('Erro ao atualizar:', error);
                }
            }
        }

        httpRequest()
    }, [config]);

    return {listReceitas, listDespesas, httpConfig};
};

