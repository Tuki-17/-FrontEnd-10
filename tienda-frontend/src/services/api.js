export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const getProductos = async () => {
    const response = await fetch(`${API_URL}/productos/`);
    if (!response.ok) {
        throw new Error('Error al comunicarse con la API');
    }
    return await response.json();
};

export const solicitarArrepentimiento = async (email, codigoCompra, detalle = '') => {
    const response = await fetch(`${API_URL}/arrepentimiento`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            codigo_compra: codigoCompra,
            detalle,
        }),
    });
    if (!response.ok) {
        throw new Error('Error al procesar la revocación de la compra');
    }
    return await response.json();
};

export const registerUser = async (nombre, email, password, aceptoTratamiento) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nombre,
            email,
            password,
            acepto_tratamiento: aceptoTratamiento
        }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Error al registrar usuario');
    }
    return await response.json();
};

export const checkout = async (email, items) => {
    const response = await fetch(`${API_URL}/pedidos/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            items
        }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Error al procesar compra');
    }
    return await response.json();
};

export const loginUser = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Error al iniciar sesión');
    }
    return await response.json();
};

export const getMe = async (token) => {
    const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Error al obtener el usuario');
    }
    return await response.json();
};

export const createProducto = async (token, producto) => {
    const response = await fetch(`${API_URL}/productos/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(producto)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Error al crear producto');
    }
    return await response.json();
};

export const updateProducto = async (token, id, producto) => {
    const response = await fetch(`${API_URL}/productos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(producto)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Error al actualizar producto');
    }
    return await response.json();
};