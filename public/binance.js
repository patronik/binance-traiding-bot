const feePercent = 0.2;  
function subtractPercentage(amount, percentage) {
    const reduction = (amount * percentage) / 100;
    const newAmount  = amount - reduction;
    return newAmount;
}

async function getSymbolPrecision(symbol) {
    const response = await fetch(`/precision/${symbol}`);
    const data = await response.json(); 
    return {
        qty: parseFloat(data.quantityPrecision).toString().split('.')[1].length,
        price: parseFloat(data.pricePrecision).toString().split('.')[1].length,
    };
}

async function sellAll(symbol) {
    let symbolTotalAmount = parseFloat(document.getElementById(`f-bal-${symbol}`).textContent);
    if (isNaN(symbolTotalAmount)) {
        alert('Invalid asset amount.');  
        return;
    }

    const assetUSDTPrice = parseFloat(document.getElementById(`price-${symbol}`).textContent);
    if (isNaN(assetUSDTPrice)) {
        alert(`Invalid asset USDT price ${assetUSDTPrice}.`);  
        return;
    }     
        
    symbolTotalAmount = subtractPercentage(symbolTotalAmount, feePercent);    

    const precision = await getSymbolPrecision(symbol);
    symbolTotalAmount = symbolTotalAmount.toFixed(precision.qty);

    const USDTAmount = (assetUSDTPrice * symbolTotalAmount).toFixed(2);
    const confirmation = confirm(
        `Are you sure you want to sell ${symbolTotalAmount} of ${symbol} (${USDTAmount} USDT)?`
    );

    if (confirmation) {
        try {
            const response = await fetch('/sell-symbol', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: symbolTotalAmount, symbol })
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

    buyAmount = subtractPercentage(buyAmount, feePercent);

    const precision = await getSymbolPrecision(symbol);
    buyAmount = buyAmount.toFixed(precision.qty);

    const confirmation = confirm(`Are you sure you want to buy ${buyAmount} of ${symbol} (for ${fixedUSDT} USDT)?`);

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
        
    let buyAmount = parseFloat((USDTBal / 100 * USDTPercent) / assetUSDTPrice);
    if (isNaN(buyAmount)) {
        alert(`Invalid amount to buy ${buyAmount}.`);  
        return;
    }    

    buyAmount = subtractPercentage(buyAmount, feePercent);

    const precision = await getSymbolPrecision(symbol);
    buyAmount = buyAmount.toFixed(precision.qty);

    const confirmation = confirm(`Are you sure you want to buy ${buyAmount} of ${symbol} (for ${USDTPercent}% USDT)?`);

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