document.addEventListener("DOMContentLoaded", () => {
  const productsContainer = document.getElementById("products");
  const controlsContainer = document.createElement("div");
  controlsContainer.classList.add("controls");

  controlsContainer.innerHTML = `
    <label for="productLimit">Exibir</label>
    <select id="productLimit"></select>
    <p id="totalProducts"></p> <!-- Parágrafo para exibir o total de produtos -->
  `;

  productsContainer.before(controlsContainer);

  const paginationContainer = document.createElement("div");
  paginationContainer.classList.add("pagination-controls");

  paginationContainer.innerHTML = `
    <button id="prevPage">Ant.</button>
    <span id="pageInfo">1</span>
    <button id="nextPage">Próx.</button>
  `;

  productsContainer.after(paginationContainer);

  const productLimitSelect = document.getElementById("productLimit");
  const prevPageButton = document.getElementById("prevPage");
  const nextPageButton = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  const totalProductsElement = document.getElementById("totalProducts"); // Referência ao elemento que vai exibir o total de produtos

  let allProducts = [];
  let currentPage = 1;
  let productsPerPage = 4;
  let cart = [];

  function updateProductLimitOptions() {
    const isMobile = window.innerWidth <= 768;
    const options = isMobile ? [1, 2] : [4, 5, "all"];

    productLimitSelect.innerHTML = options
      .map(
        (value) =>
          `<option value="${value}">${
            value === "all" ? "Todos" : value + " Produtos"
          }</option>`
      )
      .join("");

    if (!productLimitSelect.value) {
      productsPerPage = 4;
    } else {
      productsPerPage = parseInt(productLimitSelect.value) || 4;
    }
    currentPage = 1;
    updateProductDisplay();
  }

  async function fetchProducts() {
    try {
      const response = await fetch("https://desafio.xlow.com.br/search");
      allProducts = await response.json();

      if (allProducts.length === 0) {
        productsContainer.innerHTML = "<p>Não há produtos disponíveis.</p>";
        totalProductsElement.textContent = "Total de produtos: 0"; // Exibe total de produtos (0)
      } else {
        updateProductDisplay();
        totalProductsElement.textContent = `Total de produtos: ${allProducts.length}`; // Exibe total de produtos
      }
    } catch (error) {
      console.error("Erro ao buscar os produtos:", error);
      productsContainer.innerHTML = "<p>Erro ao carregar os produtos.</p>";
    }
  }

  function updateProductDisplay() {
    const selectedLimit = productLimitSelect.value;
    productsPerPage =
      selectedLimit === "all" ? allProducts.length : parseInt(selectedLimit);

    const startIndex = (currentPage - 1) * productsPerPage;
    const paginatedProducts = allProducts.slice(
      startIndex,
      startIndex + productsPerPage
    );

    displayProducts(paginatedProducts);

    pageInfo.textContent = `${currentPage}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled =
      startIndex + productsPerPage >= allProducts.length;
  }

  async function displayProducts(products) {
    productsContainer.innerHTML = "";

    for (const product of products) {
      const productDetails = await fetchProductDetails(product.productId);
      if (productDetails) {
        const productCard = document.createElement("div");
        productCard.classList.add("product");

        const price =
          productDetails.items?.[0]?.sellers?.[0]?.commertialOffer?.Price ||
          "Indisponível";
        const listPrice =
          productDetails.items?.[0]?.sellers?.[0]?.commertialOffer?.ListPrice ||
          null;
        const imageUrl =
          productDetails.items?.[0]?.images?.[0]?.imageUrl ||
          "https://via.placeholder.com/150";
        const variationImages = productDetails.items?.[0]?.images || [];

        const priceWithDiscount =
          listPrice && price < listPrice
            ? `<span class="price-with-discount">R$ ${listPrice}</span>
               <span class="price">R$ ${price}</span>`
            : `<span class="price">R$ ${price}</span>`;

        productCard.innerHTML = `
          <div class="product-image-container">
            <img id="mainImage-${product.productId}" src="${imageUrl}" alt="${
          product.productName
        }" class="product-main-image" />
            <div class="product-variation-images">
              ${variationImages
                .map(
                  (image) =>
                    `<img class="variation-image" src="${image.imageUrl}" alt="variação de ${product.productName}" data-image="${image.imageUrl}" />`
                )
                .join("")}
            </div>
          </div>
          <h3>${product.productName || "Nome não disponível"}</h3>
          <p>${product.brand || "Marca não disponível"}</p>
          ${priceWithDiscount}
          <button class="buy-button" data-product-id="${
            product.productId
          }">Comprar</button>
        `;

        productsContainer.appendChild(productCard);

        const variationImagesElements =
          productCard.querySelectorAll(".variation-image");
        variationImagesElements.forEach((img) => {
          img.addEventListener("click", (e) => {
            const mainImage = document.getElementById(
              `mainImage-${product.productId}`
            );
            mainImage.src = e.target.dataset.image;
          });
        });

        const buyButton = productCard.querySelector(".buy-button");
        buyButton.addEventListener("click", () => {
          addToCart(product);
        });
      }
    }
  }

  function addToCart(product) {
    const productInCart = cart.find(
      (item) => item.productId === product.productId
    );
    if (productInCart) {
      productInCart.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    console.log(cart);
  }

  async function fetchProductDetails(productId) {
    try {
      const response = await fetch(
        `https://desafio.xlow.com.br/search/${productId}`
      );
      const productDetails = await response.json();
      return productDetails[0];
    } catch (error) {
      console.error(
        `Erro ao buscar os detalhes do produto ${productId}:`,
        error
      );
      return null;
    }
  }

  prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      updateProductDisplay();
    }
  });

  nextPageButton.addEventListener("click", () => {
    const maxPages = Math.ceil(allProducts.length / productsPerPage);
    if (currentPage < maxPages) {
      currentPage++;
      updateProductDisplay();
    }
  });

  productLimitSelect.addEventListener("change", () => {
    currentPage = 1;
    updateProductDisplay();
  });

  updateProductLimitOptions();
  window.addEventListener("resize", updateProductLimitOptions);

  fetchProducts();
});
