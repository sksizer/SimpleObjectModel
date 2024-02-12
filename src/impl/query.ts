function Query<T>(data: any[], queryObject: { [key: string]: any }): T[] {
  return data.filter((d) => {
    let match = true;
    Object.keys(queryObject).forEach((key) => {
      if (d[key] !== queryObject[key]) {
        match = false;
      }
    });
    return match;
  });
}

export { Query };
