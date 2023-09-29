if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.form.querySelector('[name=id]').disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButton.querySelector('span').classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, { source: 'product-form', productVariantId: formData.get('id'), cartData: response });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
              console.log(response);
            }
              // Check if the product with variant id "46901487108376" was added	
            const variantId = formData.get('id');	
            if (variantId === '46901487108376') {	
               // Check if the product with variant id "46874731217176" is already in the cart	
                let isSecondProductInCart = false;	
                fetch('/cart.js', {	
                  method: 'GET',	
                  headers: {	
                    'Content-Type': 'application/json',	
                  },	
                }).then((response) => response.json())	
                  .then((cartData) => {	
                    console.log(cartData);	
                    for (let i = 0; i < cartData.items.length; i++) {	
                      const item = cartData.items[i];	
                      if (item.variant_id === 46874731217176) {	
                        isSecondProductInCart = true;	
                        break;	
                      }	
                    }	
                    	
                    console.log(isSecondProductInCart);	
                    	
                    if (!isSecondProductInCart) {	
                        // If so, initiate a request to add the product with id "46874731217176"	
                        const additionalFormData = new FormData(this.form);	
                        additionalFormData.set('id', '46874731217176'); // Set the desired product id	
          	
                        const additionalConfig = fetchConfig('javascript');	
                        additionalConfig.headers['X-Requested-With'] = 'XMLHttpRequest';	
                        delete additionalConfig.headers['Content-Type'];	
                        additionalConfig.body = additionalFormData;	
          	
                        return fetch(`${routes.cart_add_url}`, additionalConfig)	
                          .then((response) => response.json())	
                          .then((response) => {	
                            // Handle the response for the second request here (if needed)	
                          })	
                          .catch((e) => {	
                            console.error(e);	
                          });	
                      }	
                    	
                    	
                  });	
                }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading-overlay__spinner').classList.add('hidden');
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}
