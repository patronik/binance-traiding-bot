const binanceFee = parseFloat(document.getElementById(`binanceFee`).value);

function substractFee(amount, percentage) {
    const reduction = (amount * percentage) / 100;
    const newAmount  = amount - reduction;
    return newAmount;
}

function trimAmount(amount, precision) {
    const amountParts = amount.toString().split('.');    
    if (amountParts.length != 2) {
        alert(`Invalid amount ${amount}`);
        return;
    }

    precision = parseInt(precision);
    if (isNaN(precision)) {
        alert(`Invalid precision ${precision}`);
        return;
    }

    if (precision == 0) {
        return parseFloat(amountParts[0]);
    } else if (precision > 0) {
        let fractionalPart = amountParts[1].substring(
            0, 
            Math.min(amountParts[1].length, precision)
        );
        return parseFloat(`${amountParts[0]}.${fractionalPart}`);
    } else {
        alert(`Invalid precision ${precision}`);
        return;
    }
}

async function getSymbolPrecision(symbol) {
    const response = await fetch(`/precision/${symbol}`);
    const {qtyPrecision, pricePrecision, minNotional} = await response.json(); 

    const result = {qty: 0, price: 0, minNot: parseFloat(minNotional || 0)};

    let qtyPrecisionParts = parseFloat(qtyPrecision).toString().split('.');
    if (qtyPrecisionParts.length == 2) {
        result['qty'] = qtyPrecisionParts[1].length;
    } 

    let pricePrecisionParts = parseFloat(pricePrecision).toString().split('.');
    if (pricePrecisionParts.length == 2) {
        result['price'] = pricePrecisionParts[1].length;
    } 

    return result;
}

async function sellAll(symbol) {
    let assetOrderAmount = parseFloat(document.getElementById(`f-bal-${symbol}`).textContent);
    if (isNaN(assetOrderAmount)) {
        alert('Invalid asset amount.');  
        return;
    }

    const precision = await getSymbolPrecision(symbol);
 
    assetOrderAmount = trimAmount(substractFee(assetOrderAmount, binanceFee), precision.qty);

    const assetUSDTPrice = parseFloat(document.getElementById(`price-${symbol}`).textContent);
    if (isNaN(assetUSDTPrice)) {
        alert(`Invalid asset USDT price ${assetUSDTPrice}.`);  
        return;
    }    

    const USDTOrderAmount = assetUSDTPrice * assetOrderAmount;
    if (USDTOrderAmount < precision.minNot) {
        alert(`Total order value ${USDTOrderAmount} USDT is less than min value ${precision.minNot} USDT.`);  
        return;
    }

    const confirmation = confirm(`Do you confirm selling ${assetOrderAmount} of ${symbol} fot ${USDTOrderAmount} USDT?`);

    if (confirmation) {
        try {
            const response = await fetch('/sell-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: assetOrderAmount, symbol })
            });
            const data = await response.json();
            alert(`Sell Response: ${JSON.stringify(data)}`);
        } catch (error) {
            alert('Error placing sell order:', error);
        }
    }
}

async function buyForFixedUSDT(symbol) {
    const USDTOrderAmount = parseFloat(document.getElementById(`fixedUSDT`).value);
    if (isNaN(USDTOrderAmount)) {
        alert(`Invalid fixed USDT amount ${USDTOrderAmount}.`);  
        return;
    }    

    const assetUSDTPrice = parseFloat(document.getElementById(`price-${symbol}`).textContent);
    if (isNaN(assetUSDTPrice)) {
        alert(`Invalid asset price ${assetUSDTPrice}.`);  
        return;
    }    
    
    const precision = await getSymbolPrecision(symbol);
    if (USDTOrderAmount < precision.minNot) {        
        alert(`Total order value ${USDTOrderAmount} USDT is less than min value ${precision.minNot} USDT.`);  
        return;
    }

    let buyAmount = trimAmount(substractFee(parseFloat(USDTOrderAmount / assetUSDTPrice),binanceFee), precision.qty);      
    if (isNaN(buyAmount)) {
        alert(`Invalid amount to buy ${buyAmount}.`);  
        return;
    }              

    const confirmation = confirm(`Do you confirm buying ${buyAmount} of ${symbol} for ${USDTOrderAmount} USDT?`);

    if (confirmation) {
        try {
            const response = await fetch('/buy-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: buyAmount, symbol })
            });
            const data = await response.json();
            alert(`Buy Response: ${JSON.stringify(data)}`);
        } catch (error) {
            alert('Error placing buy order:', error);
        }
    }
}

async function buyUSDTPercent(symbol) {
    const USDTPercent = parseFloat(document.getElementById(`USDTPercent`).value);
    if (isNaN(USDTPercent) || (USDTPercent > 100 || USDTPercent < 10)) {
        alert(`Invalid buy USDT percent ${USDTPercent}%.`); 
        return;
    }

    const USDTBal = parseFloat(document.getElementById(`usdt-bal`).textContent);
    if (isNaN(USDTBal)) {
        alert(`Invalid USDT balance ${USDTBal}.`);  
        return;
    }    

    const assetUSDTPrice = parseFloat(document.getElementById(`price-${symbol}`).textContent);
    if (isNaN(assetUSDTPrice)) {
        alert(`Invalid asset price ${assetUSDTPrice}.`);  
        return;
    }        
                
    const precision = await getSymbolPrecision(symbol);    
    const USDTOrderAmount = (USDTBal / 100 * USDTPercent);
    if (USDTOrderAmount < precision.minNot) {
        alert(`Total order value ${USDTOrderAmount} USDT is less than min value ${precision.minNot} USDT.`);  
        return;
    }            

    let buyAmount = trimAmount(substractFee(parseFloat(USDTOrderAmount / assetUSDTPrice), binanceFee), precision.qty);

    if (isNaN(buyAmount)) {
        alert(`Invalid amount to buy ${buyAmount}.`);  
        return;
    }    
        
    const confirmation = confirm(`Do you confirm buying ${buyAmount} of ${symbol} for ${USDTOrderAmount} USDT?`);

    if (confirmation) {
        try {
            const response = await fetch('/buy-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: buyAmount, symbol })
            });
            const data = await response.json();
            alert(`Buy Response: ${JSON.stringify(data)}`);
        } catch (error) {
            alert('Error placing buy order:', error);
        }
    }
}