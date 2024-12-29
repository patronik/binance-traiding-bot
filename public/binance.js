const binanceFeePercent = 0.2;  
function subtractPercentage(amount, percentage) {
    const reduction = (amount * percentage) / 100;
    const newAmount  = amount - reduction;
    return newAmount;
}

function roundOrderAmount(amount, precision) {
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
    let symbolOrderAmount = parseFloat(document.getElementById(`f-bal-${symbol}`).textContent);
    if (isNaN(symbolOrderAmount)) {
        alert('Invalid asset amount.');  
        return;
    }

    symbolOrderAmount = subtractPercentage(symbolOrderAmount, binanceFeePercent);     
        
    const precision = await getSymbolPrecision(symbol);
    symbolOrderAmount = roundOrderAmount(symbolOrderAmount, precision.qty);

    const assetUSDTPrice = parseFloat(document.getElementById(`price-${symbol}`).textContent);
    if (isNaN(assetUSDTPrice)) {
        alert(`Invalid asset USDT price ${assetUSDTPrice}.`);  
        return;
    }    

    const USDTOrderAmount = assetUSDTPrice * symbolOrderAmount;
    if (USDTOrderAmount < precision.minNot) {
        alert(`Total order value ${USDTOrderAmount} USDT is less than min value ${precision.minNot} USDT.`);  
        return;
    }

    const confirmation = confirm(`Do you confirm selling ${symbolOrderAmount} of ${symbol} fot ${USDTOrderAmount} USDT?`);

    if (confirmation) {
        try {
            const response = await fetch('/sell-symbol', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: symbolOrderAmount, symbol })
            });
            const data = await response.json();
            alert(`Sell Response: ${JSON.stringify(data)}`);
        } catch (error) {
            alert('Error placing sell order:', error);
        }
    }
}

async function buyForFixedUSDT(symbol) {
    const fixedUSDT = parseFloat(document.getElementById(`fixedUSDT`).value);
    if (isNaN(fixedUSDT)) {
        alert(`Invalid fixed USDT amount ${fixedUSDT}.`);  
        return;
    }    

    const assetUSDTPrice = parseFloat(document.getElementById(`price-${symbol}`).textContent);
    if (isNaN(assetUSDTPrice)) {
        alert(`Invalid asset price ${assetUSDTPrice}.`);  
        return;
    }    
        
    let buyAmount = parseFloat(fixedUSDT / assetUSDTPrice);
    if (isNaN(buyAmount)) {
        alert(`Invalid amount to buy ${buyAmount}.`);  
        return;
    }    

    buyAmount = subtractPercentage(buyAmount, binanceFeePercent);

    const precision = await getSymbolPrecision(symbol);
    buyAmount = roundOrderAmount(buyAmount, precision.qty);

    if (fixedUSDT < precision.minNot) {        
        alert(`Total order value ${fixedUSDT} USDT is less than min value ${precision.minNot} USDT.`);  
        return;
    }

    const confirmation = confirm(`Do you confirm buying ${buyAmount} of ${symbol} for ${fixedUSDT} USDT?`);

    if (confirmation) {
        try {
            const response = await fetch('/buy-symbol', {
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
    if (isNaN(USDTPercent)) {
        alert(`Invalid buy percent ${USDTPercent}.`); 
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
    
    const USDTOrderAmount = (USDTBal / 100 * USDTPercent);
    let buyAmount = parseFloat(USDTOrderAmount / assetUSDTPrice);
    if (isNaN(buyAmount)) {
        alert(`Invalid amount to buy ${buyAmount}.`);  
        return;
    }    

    const precision = await getSymbolPrecision(symbol);
    if (USDTOrderAmount < precision.minNot) {
        alert(`Total order value ${USDTOrderAmount} USDT is less than min value ${precision.minNot} USDT.`);  
        return;
    }

    buyAmount = subtractPercentage(buyAmount, binanceFeePercent);
    buyAmount = roundOrderAmount(buyAmount, precision.qty);

    const confirmation = confirm(`Do you confirm buying ${buyAmount} of ${symbol} for ${USDTOrderAmount} USDT?`);

    if (confirmation) {
        try {
        const response = await fetch('/buy-symbol', {
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