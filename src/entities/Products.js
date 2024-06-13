class Product {
    #id;
    name;
    description;
    sizes;
    colors;
    constructor (id, name, description, sizes, colors) {
        this.#id = id;
        this.name = name;
        this.description = description;
        this.sizes = sizes;
        this.colors = colors;
    }

    get product(){
        return this.getProducts();
    }

    getProduct() {
        let productList = [];
        productList.push(this.name, this.description, this.sizes, this.colors);
        return productList;
    }
};