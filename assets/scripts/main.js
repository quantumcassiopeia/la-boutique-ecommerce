const buyButton = productCard.querySelector(".buy-button");
buyButton.addEventListener("click", () => {
  addToCart(product);
});

// Footer
document.getElementById("date").textContent = new Date().getFullYear();
