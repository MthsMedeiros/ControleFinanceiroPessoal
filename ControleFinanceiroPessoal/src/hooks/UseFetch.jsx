import { useState, useEffect } from 'react'

export const UseFetch = (url) => {
    let [listReceitas, setListReceitas] = useState([])

    let [listDespesas, setListDespesas] = useState([])

    let [listCartoes, setListCartoes] = useState([])

    let [idDelete, setIdDelete] = useState(null)

    let [idUpdate, setIdUpdate] = useState(null)

    let [config, setConfig] = useState(null)

    let [callFetchData, setCallFetchData] = useState(0)

    let [loading, setLoading] = useState(false)

    

    

    

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
                setLoading(true)
                const response = await fetch(url);
                const json = await response.json();
                setListReceitas(json);
                setLoading(false)
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [url, callFetchData]);

    useEffect(() => {
        
        const fetchData = async () => {
            try {
                setLoading(true)
                const response = await fetch(url);
                const json = await response.json();
                setListDespesas(json);
                setLoading(false)
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [url, callFetchData]);

    useEffect(() => {
        
        const fetchData = async () => {
            try {
                setLoading(true)
                const response = await fetch(url);
                const json = await response.json();
                setListCartoes(json);
                setLoading(false)
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
                    setLoading(true)
                    const response = await fetch(url, config);            
                    const json = await response.json();
                    setCallFetchData(json);
                    setLoading(false)
                }catch(error){
                    console.error('Erro ao enviar dados:', error);
                }
            }
            if(config.method === "DELETE"){
                try {
                    setLoading(true)
                    const response = await fetch(`${url}/${idDelete}`, config);
                    const json = await response.json();
                    setCallFetchData(json);
                    setLoading(false)
                } catch(error) {
                    console.error('Erro ao deletar:', error);
                }
            }
            if(config.method === "PATCH"){
                try {
                    setLoading(true)
                    
                    const response = await fetch(`${url}/${idUpdate}`, config);
                    const json = await response.json();
                    setCallFetchData(json);
                    setLoading(false)
                } catch(error) {
                    console.error('Erro ao atualizar:', error);
                }
            }
        }

        httpRequest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config]);

    const httpConfigBatch = async (items) => {
        setLoading(true)
        try {
            for (const item of items) {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                })
                if (!response.ok) console.error(`Erro ao salvar item: ${response.status}`)
            }
        } catch(error) {
            console.error('Erro ao enviar dados em lote:', error)
        } finally {
            setCallFetchData(prev => prev + 1)
            setLoading(false)
        }
    }

    return {listReceitas, listDespesas,listCartoes, httpConfig, httpConfigBatch, loading};
};

