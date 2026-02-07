
export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    description: string;
    price: number;
    stock: number;
    minStock: number;
    unit: string;
    status: 'Active' | 'Inactive';
    createdAt: string;
    updatedAt: string;
}

class ProductService {
    private STORAGE_KEY = 'products';
    private defaultProducts: Product[] = [];

    constructor() {
        this.initialize();
    }

    private initialize() {
        const existing = localStorage.getItem(this.STORAGE_KEY);
        if (!existing) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultProducts));
        }
    }

    getAllProducts(): Product[] {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    getProductById(id: string): Product | undefined {
        return this.getAllProducts().find(p => p.id === id);
    }

    addProduct(product: Omit<Product, 'id'>): Product {
        const products = this.getAllProducts();
        const newProduct = { ...product, id: `P${(products.length + 1).toString().padStart(3, '0')}` };
        products.push(newProduct);
        this.saveProducts(products);
        return newProduct;
    }

    updateProduct(id: string, updates: Partial<Product>): void {
        const products = this.getAllProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates };
            this.saveProducts(products);
        }
    }

    deleteProduct(id: string): void {
        const products = this.getAllProducts().filter(p => p.id !== id);
        this.saveProducts(products);
    }

    updateStock(id: string, quantitySold: number): boolean {
        const products = this.getAllProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            if (products[index].stock >= quantitySold) {
                products[index].stock -= quantitySold;
                this.saveProducts(products);
                return true;
            }
        }
        return false;
    }

    private saveProducts(products: Product[]) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    }
}

export const productService = new ProductService();
