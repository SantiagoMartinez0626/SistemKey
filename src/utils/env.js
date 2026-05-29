function normalizePem(value) {
  if (!value || typeof value !== "string") {
    return value;
  }

  return value.replace(/\\n/g, "\n");
}

module.exports = {
  normalizePem
};
