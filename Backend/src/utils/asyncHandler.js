module.exports = (requestHandler) => (request, response, next) => {
  Promise.resolve(requestHandler(request, response, next)).catch(next);
};